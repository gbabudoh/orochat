'use client';

import { useState, useEffect } from 'react';
import { formatRelativeTime, formatDateTime } from '@/lib/utils/formatters';
import { Video, FileText, CheckCircle, ShieldAlert, PenTool, MoreVertical, Archive, Trash2 } from 'lucide-react';
import { verifyTextSignature, getOrCreateKeypair, signText } from '@/lib/utils/crypto';
import { AgreementData, AGREEMENT_MESSAGE_PREFIX } from '@/types/chat';

interface ContractData {
  title: string;
  terms: string;
  initiatorName: string;
  initiatorKey: JsonWebKey;
  initiatorSignature: string;
  recipientName?: string;
  recipientKey?: JsonWebKey;
  recipientSignature?: string;
  status: 'PENDING' | 'SIGNED';
}

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date | string;
    sender: {
      id: string;
      name: string;
      avatar?: string | null;
    };
  };
  currentUserId: string;
  currentUserName?: string;
  onJoinCall?: (call: { roomName: string; callSessionId?: string; initiatorId?: string; durationSeconds?: number | null; endsAt?: string | null }) => void;
  onSendMessage?: (content: string) => void;
  onArchiveCall?: (call: { messageId: string; callSessionId: string }) => void;
  onDeleteCall?: (call: { messageId: string; callSessionId?: string }) => void;
  agreementsById?: Record<string, AgreementData>;
  onSignAgreement?: (agreementId: string, signature: { signatureBase64: string; publicKeyJwk: JsonWebKey }) => Promise<{ success?: boolean; error?: string }>;
  senderPresence?: 'online' | 'offline';
}

// Verifies one signature against a payload + public key, async, and renders
// the resulting badge — shared by the agreement initiator and every signer.
function VerifiedBadge({ payload, signature, publicKeyJwk }: { payload: string; signature: string; publicKeyJwk: JsonWebKey }) {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    verifyTextSignature(payload, signature, publicKeyJwk).then(setIsValid);
  }, [payload, signature, publicKeyJwk]);

  if (isValid === null) return <span className="text-gray-400">Verifying...</span>;
  if (isValid) {
    return (
      <span className="text-emerald-500 font-medium flex items-center gap-0.5">
        <CheckCircle className="w-3 h-3" /> Verified
      </span>
    );
  }
  return (
    <span className="text-red-500 font-medium flex items-center gap-0.5">
      <ShieldAlert className="w-3 h-3" /> Invalid Signature
    </span>
  );
}

export default function MessageBubble({
  message,
  currentUserId,
  currentUserName = 'User',
  onJoinCall,
  onSendMessage,
  onArchiveCall,
  onDeleteCall,
  agreementsById,
  onSignAgreement,
  senderPresence,
}: MessageBubbleProps) {
  const [isCallMenuOpen, setIsCallMenuOpen] = useState(false);
  const isOwn = message.senderId === currentUserId;
  const isCall = message.content.startsWith('📞 LIVEKIT_CALL:');
  const callPayload = isCall ? message.content.replace('📞 LIVEKIT_CALL:', '').trim() : null;
  let callInfo: { roomName: string; callSessionId?: string; initiatorId?: string; durationSeconds?: number | null; endsAt?: string | null } | null = null;
  if (callPayload) {
    if (callPayload.startsWith('{')) {
      try {
        callInfo = JSON.parse(callPayload);
      } catch {
        callInfo = null;
      }
    } else {
      // Legacy format: plain room name, no duration metadata.
      callInfo = { roomName: callPayload };
    }
  }
  const callRoom = callInfo?.roomName ?? null;
  const isLegacyCall = isCall && !!callInfo && !callInfo.callSessionId;
  const isExpiredCall = isCall && !!callInfo?.endsAt && new Date(callInfo.endsAt).getTime() < Date.now();
  const isEndedCall = isLegacyCall || isExpiredCall;

  // Legacy single-recipient agreement flow (kept exactly as-is — old
  // messages already in the database render through this path forever).
  const isContractRequest = message.content.startsWith('📝 CONTRACT_REQUEST:');
  const isContractSigned = message.content.startsWith('📝 CONTRACT_SIGNED:');

  // New multi-party agreement flow — message just references an Agreement
  // row (relational source of truth) instead of embedding signer state.
  const isAgreementV2 = message.content.startsWith(AGREEMENT_MESSAGE_PREFIX);
  const agreementId = isAgreementV2 ? message.content.slice(AGREEMENT_MESSAGE_PREFIX.length) : null;
  const agreement = agreementId ? agreementsById?.[agreementId] : undefined;
  const [isSigningV2, setIsSigningV2] = useState(false);
  const [signErrorV2, setSignErrorV2] = useState('');

  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [isInitiatorSigValid, setIsInitiatorSigValid] = useState<boolean | null>(null);
  const [isRecipientSigValid, setIsRecipientSigValid] = useState<boolean | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (isContractRequest || isContractSigned) {
      try {
        const jsonStr = message.content.substring(message.content.indexOf('{'));
        const parsed = JSON.parse(jsonStr);
        setContractData(parsed);

        const payload = `${parsed.title}\n${parsed.terms}`;

        // Verify initiator signature
        verifyTextSignature(payload, parsed.initiatorSignature, parsed.initiatorKey).then((valid) => {
          setIsInitiatorSigValid(valid);
        });

        // Verify recipient signature
        if (isContractSigned && parsed.recipientSignature && parsed.recipientKey) {
          verifyTextSignature(payload, parsed.recipientSignature, parsed.recipientKey).then((valid) => {
            setIsRecipientSigValid(valid);
          });
        }
      } catch (err) {
        console.error('Error parsing contract JSON:', err);
      }
    }
  }, [message.content, isContractRequest, isContractSigned]);

  const handleSignContract = async () => {
    if (!contractData || isSigning) return;

    setIsSigning(true);
    try {
      // 1. Generate or load local keypair
      const { publicKeyJwk } = await getOrCreateKeypair();

      // 2. Sign contract terms
      const contractPayloadToSign = `${contractData.title}\n${contractData.terms}`;
      const { signatureBase64 } = await signText(contractPayloadToSign);

      // 3. Assemble signed payload
      const signedData = {
        ...contractData,
        recipientName: currentUserName,
        recipientKey: publicKeyJwk,
        recipientSignature: signatureBase64,
        status: 'SIGNED',
      };

      if (onSendMessage) {
        onSendMessage(`📝 CONTRACT_SIGNED:${JSON.stringify(signedData)}`);
      }
    } catch (err) {
      console.error('Failed to sign agreement cryptographically:', err);
    } finally {
      setIsSigning(false);
    }
  };

  const handleSignAgreementV2 = async () => {
    if (!agreement || isSigningV2 || !onSignAgreement) return;

    setIsSigningV2(true);
    setSignErrorV2('');
    try {
      const { publicKeyJwk } = await getOrCreateKeypair();
      const payloadToSign = `${agreement.title}\n${agreement.terms}`;
      const { signatureBase64 } = await signText(payloadToSign);

      const result = await onSignAgreement(agreement.id, { signatureBase64, publicKeyJwk });
      if (result.error) setSignErrorV2(result.error);
    } catch (err) {
      console.error('Failed to sign agreement cryptographically:', err);
      setSignErrorV2('An unexpected error occurred');
    } finally {
      setIsSigningV2(false);
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start space-x-2 max-w-[88%] sm:max-w-[80%] min-w-0 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className="w-8 h-8 rounded-full flex-shrink-0 relative">
          <div className="absolute inset-0 rounded-full bg-[#458B9E] flex items-center justify-center overflow-hidden">
            {message.sender.avatar ? (
              <img src={`/api/user/${message.sender.id}/avatar`} alt={message.sender.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white text-xs font-semibold">
                {message.sender.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {senderPresence && (
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                senderPresence === 'online' ? 'bg-green-500' : 'bg-gray-300'
              }`}
              aria-label={senderPresence}
            />
          )}
        </div>

        <div className={`rounded-lg px-4 py-2 min-w-0 ${isOwn ? 'bg-[#458B9E] text-white' : 'bg-[#F0F3F7] text-[#333333]'}`}>
          {!isOwn && (
            <div className="text-xs font-semibold mb-1 opacity-75">{message.sender.name}</div>
          )}

          {isCall && callRoom ? (
            <div className="py-2 min-w-[200px] text-center relative">
              <div className={`flex items-center justify-center gap-1.5 font-semibold mb-3 ${isOwn ? 'text-white' : 'text-[#458B9E]'}`}>
                <Video className="w-4 h-4 animate-pulse" />
                <span>Video Call by {message.sender.name}</span>
                {isOwn && (onArchiveCall || onDeleteCall) && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCallMenuOpen((v) => !v)}
                      className="p-0.5 rounded hover:bg-white/20 transition-colors"
                      aria-label="Call options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    {isCallMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 text-left">
                        {onArchiveCall && callInfo?.callSessionId && (
                          <button
                            type="button"
                            onClick={() => {
                              onArchiveCall({ messageId: message.id, callSessionId: callInfo!.callSessionId! });
                              setIsCallMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#333333] hover:bg-[#F0F3F7] transition-colors"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            Archive
                          </button>
                        )}
                        {onDeleteCall && (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteCall({ messageId: message.id, callSessionId: callInfo?.callSessionId });
                              setIsCallMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {isEndedCall ? (
                <div className={`w-full py-1.5 px-4 rounded-lg text-xs font-bold ${isOwn ? 'bg-white/20 text-white/80' : 'bg-gray-200 text-gray-500'}`}>
                  Call Ended
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onJoinCall && callInfo && onJoinCall(callInfo)}
                  className={`w-full py-1.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    isOwn
                      ? 'bg-white text-[#458B9E] hover:bg-gray-50'
                      : 'bg-[#458B9E] text-white hover:bg-[#3a7585]'
                  }`}
                >
                  Join Meeting
                </button>
              )}
            </div>
          ) : isContractRequest && contractData ? (
            <div className="py-1 min-w-0 sm:min-w-[320px]">
              <div className="flex items-center gap-2 mb-3 border-b pb-2 border-current/10">
                <FileText className="w-4 h-4 shrink-0 animate-pulse" />
                <span className="font-bold text-sm">Agreement Signature Request</span>
              </div>
              <h4 className="font-semibold text-sm mb-2">{contractData.title}</h4>
              <p className={`text-xs p-3 rounded-lg border mb-3 overflow-y-auto max-h-36 whitespace-pre-wrap leading-relaxed ${
                isOwn ? 'bg-black/10 border-white/10 text-white/90' : 'bg-white/80 border-gray-200 text-gray-700'
              }`}>
                {contractData.terms}
              </p>

              {/* Status & Verify */}
              <div className="space-y-1.5 mb-4 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span>Drafted & Signed by:</span>
                  <span className="font-semibold">{contractData.initiatorName}</span>
                  {isInitiatorSigValid === true ? (
                    <span className="text-emerald-500 font-medium flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  ) : isInitiatorSigValid === false ? (
                    <span className="text-red-500 font-medium flex items-center gap-0.5 animate-bounce">
                      <ShieldAlert className="w-3 h-3" /> Invalid Signature
                    </span>
                  ) : (
                    <span className="text-gray-400">Verifying...</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-current/80">
                  <span>Recipient status:</span>
                  <span className="font-semibold italic">Pending local signature</span>
                </div>
              </div>

              {!isOwn ? (
                <button
                  type="button"
                  onClick={handleSignContract}
                  disabled={isSigning}
                  className={`w-full py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 ${
                    isOwn
                      ? 'bg-white text-[#458B9E] hover:bg-gray-50'
                      : 'bg-[#458B9E] text-white hover:bg-[#3a7585]'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{isSigning ? 'Signing...' : 'Approve & Sign Agreement'}</span>
                </button>
              ) : (
                <div className="text-[10px] text-center opacity-75 italic py-1 border border-dashed border-current/25 rounded-md">
                  Waiting for recipient signature
                </div>
              )}
            </div>
          ) : isContractSigned && contractData ? (
            <div className="py-1 min-w-0 sm:min-w-[320px]">
              <div className="flex items-center gap-2 mb-3 border-b pb-2 border-current/10 text-emerald-500">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="font-bold text-sm">Agreement Fully Executed</span>
              </div>
              <h4 className="font-semibold text-sm mb-2">{contractData.title}</h4>
              <p className={`text-xs p-3 rounded-lg border mb-3 overflow-y-auto max-h-36 whitespace-pre-wrap leading-relaxed ${
                isOwn ? 'bg-black/10 border-white/10 text-white/90' : 'bg-white/80 border-gray-200 text-gray-700'
              }`}>
                {contractData.terms}
              </p>

              {/* Status & Verify */}
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span>Signed by Creator:</span>
                  <span className="font-semibold">{contractData.initiatorName}</span>
                  {isInitiatorSigValid === true ? (
                    <span className="text-emerald-500 font-medium flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  ) : isInitiatorSigValid === false ? (
                    <span className="text-red-500 font-medium flex items-center gap-0.5">
                      <ShieldAlert className="w-3 h-3" /> Invalid Signature
                    </span>
                  ) : (
                    <span className="text-gray-400">Verifying...</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Signed by Recipient:</span>
                  <span className="font-semibold">{contractData.recipientName || 'Recipient'}</span>
                  {isRecipientSigValid === true ? (
                    <span className="text-emerald-500 font-medium flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  ) : isRecipientSigValid === false ? (
                    <span className="text-red-500 font-medium flex items-center gap-0.5">
                      <ShieldAlert className="w-3 h-3" /> Invalid Signature
                    </span>
                  ) : (
                    <span className="text-gray-400">Verifying...</span>
                  )}
                </div>
                <div className="mt-3 pt-2 border-t border-current/10 flex items-center justify-center text-center font-bold text-[9px] uppercase tracking-wider text-emerald-500 gap-1 bg-emerald-500/5 p-1 rounded-md">
                  🔒 Cryptographically Verified Agreement
                </div>
              </div>
            </div>
          ) : isAgreementV2 && agreement ? (
            <div className="py-1 min-w-0 sm:min-w-[320px]">
              {agreement.status === 'EXECUTED' ? (
                <div className="flex items-center gap-2 mb-3 border-b pb-2 border-current/10 text-emerald-500">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-sm">Agreement Fully Executed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-3 border-b pb-2 border-current/10">
                  <FileText className="w-4 h-4 shrink-0 animate-pulse" />
                  <span className="font-bold text-sm">Agreement Signature Request</span>
                </div>
              )}

              <h4 className="font-semibold text-sm mb-2">{agreement.title}</h4>
              <p className={`text-xs p-3 rounded-lg border mb-3 overflow-y-auto max-h-36 whitespace-pre-wrap leading-relaxed ${
                isOwn ? 'bg-black/10 border-white/10 text-white/90' : 'bg-white/80 border-gray-200 text-gray-700'
              }`}>
                {agreement.terms}
              </p>

              <div className="space-y-1.5 mb-3 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span>Drafted & Signed by:</span>
                  <span className="font-semibold">{agreement.initiator.name}</span>
                  <VerifiedBadge
                    payload={`${agreement.title}\n${agreement.terms}`}
                    signature={agreement.initiatorSignature}
                    publicKeyJwk={agreement.initiatorKey}
                  />
                </div>
                {agreement.signers.map((signer) => (
                  <div key={signer.id} className="flex items-center gap-1.5">
                    <span>{signer.user.name}:</span>
                    {signer.signedAt && signer.signature && signer.publicKeyJwk ? (
                      <VerifiedBadge
                        payload={`${agreement.title}\n${agreement.terms}`}
                        signature={signer.signature}
                        publicKeyJwk={signer.publicKeyJwk}
                      />
                    ) : (
                      <span className="font-semibold italic text-current/80">Pending local signature</span>
                    )}
                  </div>
                ))}
              </div>

              {(() => {
                const mySignerRow = agreement.signers.find((s) => s.userId === currentUserId);
                if (mySignerRow && !mySignerRow.signedAt) {
                  return (
                    <div>
                      <button
                        type="button"
                        onClick={handleSignAgreementV2}
                        disabled={isSigningV2}
                        className={`w-full py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 ${
                          isOwn
                            ? 'bg-white text-[#458B9E] hover:bg-gray-50'
                            : 'bg-[#458B9E] text-white hover:bg-[#3a7585]'
                        }`}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>{isSigningV2 ? 'Signing...' : 'Approve & Sign Agreement'}</span>
                      </button>
                      {signErrorV2 && <p className="text-[10px] text-red-500 mt-1 text-center">{signErrorV2}</p>}
                    </div>
                  );
                }
                if (agreement.status !== 'EXECUTED') {
                  return (
                    <div className="text-[10px] text-center opacity-75 italic py-1 border border-dashed border-current/25 rounded-md">
                      Waiting for {agreement.signers.filter((s) => !s.signedAt).length} more signature
                      {agreement.signers.filter((s) => !s.signedAt).length === 1 ? '' : 's'}
                    </div>
                  );
                }
                return (
                  <div className="pt-1 flex items-center justify-center text-center font-bold text-[9px] uppercase tracking-wider text-emerald-500 gap-1 bg-emerald-500/5 p-1 rounded-md">
                    🔒 Cryptographically Verified Agreement
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-sm break-words whitespace-pre-wrap">{message.content}</div>
          )}

          <div
            className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}
            title={formatDateTime(message.createdAt)}
          >
            {formatRelativeTime(message.createdAt)} &middot; {formatDateTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

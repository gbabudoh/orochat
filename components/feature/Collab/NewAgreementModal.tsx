'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { X, FileText } from 'lucide-react';
import { getOrCreateKeypair, signText } from '@/lib/utils/crypto';

interface Member {
  id: string;
  name: string;
  avatar?: string | null;
}

interface NewAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    title: string,
    terms: string,
    signerUserIds: string[],
    signature: { signatureBase64: string; publicKeyJwk: JsonWebKey }
  ) => Promise<{ success?: boolean; error?: string }>;
  members: Member[];
  isGroup: boolean;
}

export default function NewAgreementModal({ isOpen, onClose, onCreate, members, isGroup }: NewAgreementModalProps) {
  const [title, setTitle] = useState('');
  const [terms, setTerms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSignerIds, setSelectedSignerIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setSelectedSignerIds(members.map((m) => m.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSigner = (id: string) => {
    setSelectedSignerIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !terms.trim() || isLoading) return;

    const signerUserIds = isGroup ? selectedSignerIds : members[0] ? [members[0].id] : [];
    if (signerUserIds.length === 0) {
      setError('Select at least one person who needs to sign');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      // 1. Generate/get local keypair
      await getOrCreateKeypair();

      // 2. Sign agreement terms
      const payloadToSign = `${title.trim()}\n${terms.trim()}`;
      const { signatureBase64, publicKeyJwk } = await signText(payloadToSign);

      // 3. Create the agreement (server records initiator signature + one PENDING row per signer)
      const result = await onCreate(title.trim(), terms.trim(), signerUserIds, { signatureBase64, publicKeyJwk });

      if (result.error) {
        setError(result.error);
      } else {
        setTitle('');
        setTerms('');
        onClose();
      }
    } catch (err) {
      console.error('Failed to create cryptographic agreement:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-[#333333] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#458B9E]" />
            <span>Create Cryptographic Agreement</span>
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Agreement Title</label>
            <Input
              type="text"
              required
              placeholder="e.g., Freelance Work Deliverables Contract"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Terms & Scope of Work</label>
            <textarea
              required
              rows={6}
              placeholder="Detail the deliverables, payment details, milestones, and deadlines clearly..."
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full rounded-lg border border-gray-200 p-3 text-sm text-[#333333] focus:outline-none focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all resize-none"
            />
          </div>

          {isGroup && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Required Signers ({selectedSignerIds.length} of {members.length} selected)
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleSigner(member.id)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                      selectedSignerIds.includes(member.id)
                        ? 'bg-[#458B9E] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                The agreement is only fully executed once everyone selected here has signed.
              </p>
            </div>
          )}

          <div className="bg-[#458B9E]/5 p-3 rounded-lg text-xs text-gray-500 border border-[#458B9E]/10 leading-relaxed">
            <strong>🔒 Browser Cryptography:</strong> Clicking submit generates a secure, asymmetric key pair (ECDSA P-256) locally inside this browser. A secure digital signature of these terms is computed using your private key (which never leaves your device).
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border-l-4 border-red-400 rounded-lg p-3">{error}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" isLoading={isLoading} disabled={!title.trim() || !terms.trim()}>
              Sign & Send Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

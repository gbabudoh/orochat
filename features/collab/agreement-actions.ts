'use server';

import { db } from '@/lib/db';
import { webcrypto } from 'node:crypto';
import { assertParticipant, sendMessage } from './actions';
import { AGREEMENT_MESSAGE_PREFIX } from '@/types/chat';

const SIGNER_USER_SELECT = { id: true, name: true, avatar: true } as const;

const AGREEMENT_INCLUDE = {
  initiator: { select: SIGNER_USER_SELECT },
  signers: { include: { user: { select: SIGNER_USER_SELECT } } },
} as const;

async function verifySignatureServer(text: string, signatureBase64: string, publicKeyJwk: JsonWebKey): Promise<boolean> {
  try {
    const publicKey = await webcrypto.subtle.importKey(
      'jwk',
      publicKeyJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify']
    );
    const data = new TextEncoder().encode(text);
    const signature = Buffer.from(signatureBase64, 'base64');
    return await webcrypto.subtle.verify({ name: 'ECDSA', hash: { name: 'SHA-256' } }, publicKey, signature, data);
  } catch {
    return false;
  }
}

/**
 * Creates a multi-party agreement: the initiator has already signed (same
 * as the legacy single-recipient flow), and one AgreementSigner row is
 * created per required signer. Posts a chat message referencing the
 * agreement id, mirroring how startCall() in ./actions.ts announces a
 * CallSession via a "Join Meeting" message instead of embedding live state
 * in the message text itself.
 */
export async function createAgreement(
  initiatorId: string,
  conversationId: string,
  title: string,
  terms: string,
  signerUserIds: string[],
  initiatorSignature: { signatureBase64: string; publicKeyJwk: JsonWebKey }
) {
  const trimmedTitle = title.trim();
  const trimmedTerms = terms.trim();
  if (!trimmedTitle || !trimmedTerms) return { error: 'Title and terms are required' };

  const uniqueSignerIds = Array.from(new Set(signerUserIds)).filter((id) => id !== initiatorId);
  if (uniqueSignerIds.length === 0) return { error: 'Select at least one required signer' };

  try {
    await assertParticipant(conversationId, initiatorId);
    for (const signerId of uniqueSignerIds) {
      await assertParticipant(conversationId, signerId);
    }

    const valid = await verifySignatureServer(`${trimmedTitle}\n${trimmedTerms}`, initiatorSignature.signatureBase64, initiatorSignature.publicKeyJwk);
    if (!valid) return { error: 'Initiator signature could not be verified' };

    const agreement = await db.agreement.create({
      data: {
        conversationId,
        title: trimmedTitle,
        terms: trimmedTerms,
        initiatorId,
        initiatorKey: initiatorSignature.publicKeyJwk as object,
        initiatorSignature: initiatorSignature.signatureBase64,
        signers: { create: uniqueSignerIds.map((userId) => ({ userId })) },
      },
    });

    const formData = new FormData();
    formData.append('content', `${AGREEMENT_MESSAGE_PREFIX}${agreement.id}`);
    formData.append('conversationId', conversationId);
    const sent = await sendMessage(initiatorId, formData);

    if (sent.success && sent.message) {
      await db.agreement.update({ where: { id: agreement.id }, data: { messageId: sent.message.id } });
    }

    return { success: true, message: sent.success ? sent.message : undefined };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to create agreement' };
  }
}

/**
 * Records one required signer's signature. Verifies it server-side before
 * persisting (an integrity check the legacy single-recipient flow never
 * had), and flips the agreement to EXECUTED once every required signer has
 * signed.
 */
export async function signAgreement(
  agreementId: string,
  userId: string,
  signature: { signatureBase64: string; publicKeyJwk: JsonWebKey }
) {
  try {
    const agreement = await db.agreement.findUnique({ where: { id: agreementId }, include: { signers: true } });
    if (!agreement) return { error: 'Agreement not found' };

    const signerRow = agreement.signers.find((s) => s.userId === userId);
    if (!signerRow) return { error: 'You are not a required signer on this agreement' };
    if (signerRow.signedAt) return { error: 'You have already signed this agreement' };

    const valid = await verifySignatureServer(`${agreement.title}\n${agreement.terms}`, signature.signatureBase64, signature.publicKeyJwk);
    if (!valid) return { error: 'Signature could not be verified' };

    await db.agreementSigner.update({
      where: { id: signerRow.id },
      data: { publicKeyJwk: signature.publicKeyJwk as object, signature: signature.signatureBase64, signedAt: new Date() },
    });

    const remaining = await db.agreementSigner.count({ where: { agreementId, signedAt: null } });
    if (remaining === 0) {
      await db.agreement.update({ where: { id: agreementId }, data: { status: 'EXECUTED' } });
    }

    const updated = await db.agreement.findUnique({ where: { id: agreementId }, include: AGREEMENT_INCLUDE });
    return { success: true, agreement: updated };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to sign agreement' };
  }
}

export async function getAgreementsByIds(agreementIds: string[]) {
  if (agreementIds.length === 0) return [];
  return db.agreement.findMany({
    where: { id: { in: agreementIds } },
    include: AGREEMENT_INCLUDE,
  });
}

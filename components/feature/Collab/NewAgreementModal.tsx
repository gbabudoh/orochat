'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { X, FileText } from 'lucide-react';
import { getOrCreateKeypair, signText } from '@/lib/utils/crypto';

interface NewAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (contractPayload: string) => void;
  initiatorName: string;
}

export default function NewAgreementModal({ isOpen, onClose, onSend, initiatorName }: NewAgreementModalProps) {
  const [title, setTitle] = useState('');
  const [terms, setTerms] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !terms.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // 1. Generate/get local keypair
      const { publicKeyJwk } = await getOrCreateKeypair();
      
      // 2. Sign contract terms
      const contractPayloadToSign = `${title.trim()}\n${terms.trim()}`;
      const { signatureBase64 } = await signText(contractPayloadToSign);

      // 3. Assemble contract request JSON
      const requestData = {
        id: `contract-${Math.random().toString(36).substring(2, 11)}`,
        title: title.trim(),
        terms: terms.trim(),
        initiatorName,
        initiatorKey: publicKeyJwk,
        initiatorSignature: signatureBase64,
        status: 'PENDING'
      };

      onSend(`📝 CONTRACT_REQUEST:${JSON.stringify(requestData)}`);
      setTitle('');
      setTerms('');
      onClose();
    } catch (error) {
      console.error('Failed to create cryptographic agreement:', error);
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
          <div className="bg-[#458B9E]/5 p-3 rounded-lg text-xs text-gray-500 border border-[#458B9E]/10 leading-relaxed">
            <strong>🔒 Browser Cryptography:</strong> Clicking submit generates a secure, asymmetric key pair (ECDSA P-256) locally inside this browser. A secure digital signature of these terms is computed using your private key (which never leaves your device).
          </div>
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

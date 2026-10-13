import React, { useState } from 'react';
import { Mail, X, Copy, Check, Sparkles, Send } from 'lucide-react';

interface FollowUpEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: {
    subject: string;
    body: string;
  };
  prospectContact: string;
  repName: string;
}

export const FollowUpEmailModal: React.FC<FollowUpEmailModalProps> = ({
  isOpen,
  onClose,
  email,
  prospectContact,
  repName,
}) => {
  const [copied, setCopied] = useState(false);
  const [editedSubject, setEditedSubject] = useState(email.subject);
  const [editedBody, setEditedBody] = useState(email.body);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    const fullText = `Subject: ${editedSubject}\n\n${editedBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                AI Follow-Up Email Generator
              </h3>
              <p className="text-xs text-slate-400">
                Auto-drafted from call agreements, pains, and locked next steps.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Subject Line</label>
            <input
              type="text"
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email Body</label>
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={12}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <span className="text-[11px] text-slate-400">
            Recipient: <strong className="text-slate-200">{prospectContact}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={copyToClipboard}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

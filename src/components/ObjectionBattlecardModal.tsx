import React from 'react';
import { ShieldAlert, X, CheckCircle2, AlertTriangle, Play, Sparkles } from 'lucide-react';

interface ObjectionBattlecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  objections: Array<{
    timestamp: string;
    objection: string;
    repResponse: string;
    rating: 'Mastered' | 'Acceptable' | 'Needs Work';
    betterApproach: string;
  }>;
  onSeek: (seconds: number) => void;
}

export const ObjectionBattlecardModal: React.FC<ObjectionBattlecardModalProps> = ({
  isOpen,
  onClose,
  objections,
  onSeek,
}) => {
  if (!isOpen) return null;

  const parseTimestampSeconds = (ts: string) => {
    const parts = ts.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Objection Battlecard & Handling Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Review how prospect hesitations and pushbacks were managed.
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

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {objections.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                    item.rating === 'Mastered'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : item.rating === 'Acceptable'
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}>
                    {item.rating}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-200">
                    "{item.objection}"
                  </h4>
                </div>
                <button
                  onClick={() => {
                    onSeek(parseTimestampSeconds(item.timestamp));
                    onClose();
                  }}
                  className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded border border-indigo-800/60 cursor-pointer"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  {item.timestamp}
                </button>
              </div>

              <div className="text-xs text-slate-400">
                <strong className="text-slate-300">How Rep Handled: </strong>
                {item.repResponse}
              </div>

              <div className="bg-indigo-950/30 border border-indigo-900/40 rounded-lg p-2.5 text-xs text-indigo-200">
                <strong className="text-indigo-300">Ideal AI Coach Formulation: </strong>
                {item.betterApproach}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

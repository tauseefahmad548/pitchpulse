import React from 'react';
import { 
  Sparkles, 
  Upload, 
  Mic, 
  Download, 
  Mail, 
  ShieldAlert, 
  ChevronDown,
  Layers,
  Award,
  CheckSquare,
  Trophy
} from 'lucide-react';
import { SalesAnalysisResult } from '../types';
import { SAMPLE_CALLS } from '../data/sampleCalls';

interface NavbarProps {
  currentCall: SalesAnalysisResult;
  onSelectCall: (call: SalesAnalysisResult) => void;
  onOpenUploadModal: () => void;
  onOpenEmailModal: () => void;
  onOpenObjectionModal: () => void;
  onOpenCompareModal: () => void;
  onToggleHighlights: () => void;
  highlightsCount?: number;
  onScrollToLeaderboard?: () => void;
  onExportReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCall,
  onSelectCall,
  onOpenUploadModal,
  onOpenEmailModal,
  onOpenObjectionModal,
  onOpenCompareModal,
  onToggleHighlights,
  highlightsCount = 0,
  onScrollToLeaderboard,
  onExportReport,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-600/30">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                Pitch<span className="text-indigo-400">Pulse</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded">
                Intelligence
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Sales Coaching & Sentiment Analytics
            </p>
          </div>
        </div>

        {/* Center: Quick Call Switcher */}
        <div className="hidden md:flex items-center gap-2">
          <div className="relative group">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-200 cursor-pointer">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium max-w-[200px] truncate">{currentCall.callTitle}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>

            {/* Dropdown menu */}
            <div className="absolute left-0 top-full mt-1 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Sample Demonstrations
              </div>
              {SAMPLE_CALLS.map((call) => (
                <button
                  key={call.id}
                  onClick={() => onSelectCall(call)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    currentCall.id === call.id
                      ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="font-semibold truncate">{call.callTitle}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {call.repName} • {call.durationFormatted}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Call Highlights Sidebar button */}
          <button
            onClick={onToggleHighlights}
            title="Open Call Highlights & Action Items Checklist"
            className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium hidden sm:inline">Highlights</span>
            {highlightsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold flex items-center justify-center ml-0.5">
                {highlightsCount}
              </span>
            )}
          </button>

          {/* Compare Calls button */}
          <button
            onClick={onOpenCompareModal}
            title="Compare two sales calls side-by-side"
            className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium hidden md:inline">Compare</span>
          </button>

          {/* Leaderboard button */}
          {onScrollToLeaderboard && (
            <button
              onClick={onScrollToLeaderboard}
              title="View Team Performance Leaderboard"
              className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium hidden sm:inline">Leaderboard</span>
            </button>
          )}

          {/* Objections button */}
          {currentCall.keyObjections && currentCall.keyObjections.length > 0 && (
            <button
              onClick={onOpenObjectionModal}
              title="Inspect objections raised"
              className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Objections ({currentCall.keyObjections.length})</span>
            </button>
          )}

          {/* Email button */}
          {currentCall.suggestedFollowUpEmail && (
            <button
              onClick={onOpenEmailModal}
              title="View AI follow-up email"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Follow-Up Email</span>
            </button>
          )}

          {/* Export Report */}
          <button
            onClick={onExportReport}
            title="Download coaching dossier"
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Upload / Record Audio CTA */}
          <button
            onClick={onOpenUploadModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload / Record Call</span>
          </button>
        </div>
      </div>
    </header>
  );
};

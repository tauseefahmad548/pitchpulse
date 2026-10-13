import React from 'react';
import { CallScorecard } from '../types';
import { 
  Trophy, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Activity,
  Flame
} from 'lucide-react';
import { formatTime } from '../utils/audioUtils';

interface ExecutiveScorecardProps {
  scorecard: CallScorecard;
  callTitle: string;
  executiveSummary: string;
  frameworkNotes?: string;
  methodologyFramework?: string;
  onOpenCompareModal?: () => void;
}

export const ExecutiveScorecard: React.FC<ExecutiveScorecardProps> = ({
  scorecard,
  callTitle,
  executiveSummary,
  frameworkNotes,
  methodologyFramework = 'MEDDPICC',
  onOpenCompareModal,
}) => {
  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
    if (score >= 65) return 'text-amber-400 border-amber-500/40 bg-amber-950/40';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/40';
  };

  const getDealHealthBadge = (health: string) => {
    switch (health) {
      case 'High Probability':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'Moderate Risk':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      case 'Needs Nurturing':
        return 'bg-blue-950 text-blue-300 border-blue-700';
      default:
        return 'bg-rose-950 text-rose-300 border-rose-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded">
              {methodologyFramework} Intelligence
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getDealHealthBadge(scorecard.dealHealth)}`}>
              Deal Health: {scorecard.dealHealth} ({scorecard.dealHealthScore}%)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{callTitle}</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {executiveSummary}
          </p>
        </div>

        {/* Big Overall Score Badge */}
        <div className="flex items-center gap-3 shrink-0 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center font-bold ${getScoreColor(scorecard.overallScore)}`}>
            <span className="text-2xl leading-none">{scorecard.overallScore}</span>
            <span className="text-[9px] uppercase tracking-wider opacity-80 mt-0.5">/ 100</span>
          </div>
          <div className="text-left">
            <div className="text-xs text-slate-400 font-medium">PitchPulse Score</div>
            <div className="text-xs font-semibold text-slate-200">
              {scorecard.overallScore >= 80 ? 'Top Quartile Call' : scorecard.overallScore >= 65 ? 'Solid with Coaching Gaps' : 'Needs Intervention'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-500 font-mono">
                Duration: {formatTime(scorecard.callDurationSeconds)}
              </span>
              {onOpenCompareModal && (
                <button
                  onClick={onOpenCompareModal}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
                >
                  Compare Call ↗
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Talk-to-Listen Ratio */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Talk / Listen Ratio</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>{scorecard.talkListenRatio.repPercent}% Rep</span>
            <span className="text-xs text-slate-500 font-normal">/</span>
            <span className="text-emerald-400">{scorecard.talkListenRatio.prospectPercent}% Pro</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {scorecard.talkListenRatio.repPercent <= 45 ? 'Optimal active listening' : 'Rep monologue risk'}
          </div>
        </div>

        {/* Longest Rep Monologue */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Longest Rep Monologue</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-slate-100">
            {scorecard.longestMonologueSeconds}s
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {scorecard.longestMonologueSeconds <= 60 ? 'Well paced check-ins' : 'Feature dumping risk'}
          </div>
        </div>

        {/* Objections Handled */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Objection Handling</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400">
            {scorecard.objectionsHandledWell} / {scorecard.objectionsRaised} Handled
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {scorecard.objectionsRaised > 0 
              ? `${Math.round((scorecard.objectionsHandledWell / scorecard.objectionsRaised) * 100)}% resolution rate`
              : 'No major objections'}
          </div>
        </div>

        {/* Discovery Questions */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Rep Questions Asked</span>
            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-purple-300">
            {scorecard.questionsAskedRep} Questions
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ~{(scorecard.questionsAskedRep / Math.max(1, scorecard.callDurationSeconds / 60)).toFixed(1)} questions/min
          </div>
        </div>
      </div>

      {/* Framework Insights strip if present */}
      {frameworkNotes && (
        <div className="bg-indigo-950/30 border border-indigo-900/40 rounded-lg px-3.5 py-2 text-xs text-indigo-300 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>{methodologyFramework} Coach Takeaway:</strong> {frameworkNotes}
          </span>
        </div>
      )}
    </div>
  );
};

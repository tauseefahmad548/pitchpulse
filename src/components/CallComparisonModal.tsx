import React, { useState } from 'react';
import { SalesAnalysisResult } from '../types';
import { 
  GitCompare, 
  X, 
  ArrowRight, 
  ArrowLeftRight, 
  Trophy, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  ExternalLink,
  Activity,
  Layers
} from 'lucide-react';
import { formatTime } from '../utils/audioUtils';

interface CallComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCalls: SalesAnalysisResult[];
  initialCallAId?: string;
  initialCallBId?: string;
  onSelectCallToView: (call: SalesAnalysisResult) => void;
}

export const CallComparisonModal: React.FC<CallComparisonModalProps> = ({
  isOpen,
  onClose,
  availableCalls,
  initialCallAId,
  initialCallBId,
  onSelectCallToView,
}) => {
  const [callAId, setCallAId] = useState<string>(
    initialCallAId || availableCalls[0]?.id || ''
  );
  const [callBId, setCallBId] = useState<string>(
    initialCallBId || availableCalls[1]?.id || availableCalls[0]?.id || ''
  );

  if (!isOpen) return null;

  const callA = availableCalls.find((c) => c.id === callAId) || availableCalls[0];
  const callB = availableCalls.find((c) => c.id === callBId) || availableCalls[1] || availableCalls[0];

  const handleSwap = () => {
    const temp = callAId;
    setCallAId(callBId);
    setCallBId(temp);
  };

  // Metric Deltas calculation
  const scoreDelta = callB.scorecard.overallScore - callA.scorecard.overallScore;
  const monologueDelta = callB.scorecard.longestMonologueSeconds - callA.scorecard.longestMonologueSeconds;
  const objectionsRateA = callA.scorecard.objectionsRaised > 0 
    ? Math.round((callA.scorecard.objectionsHandledWell / callA.scorecard.objectionsRaised) * 100) 
    : 100;
  const objectionsRateB = callB.scorecard.objectionsRaised > 0 
    ? Math.round((callB.scorecard.objectionsHandledWell / callB.scorecard.objectionsRaised) * 100) 
    : 100;
  const objectionsDelta = objectionsRateB - objectionsRateA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Sales Call Performance Comparison
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full">
                  Side-by-Side Analytics
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Compare conversational pacing, sentiment trajectories, objection mastery, and coaching feedback.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Bar & Quick Swap */}
        <div className="px-6 py-3.5 bg-slate-950/50 border-b border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
          {/* Call A Select */}
          <div className="w-full md:w-5/12 flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-1 rounded shrink-0">
              CALL A
            </span>
            <select
              value={callAId}
              onChange={(e) => setCallAId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {availableCalls.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.callTitle} ({c.repName})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            title="Swap calls"
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
          </button>

          {/* Call B Select */}
          <div className="w-full md:w-5/12 flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-1 rounded shrink-0">
              CALL B
            </span>
            <select
              value={callBId}
              onChange={(e) => setCallBId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {availableCalls.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.callTitle} ({c.repName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Comparison Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Executive Scorecards Comparison Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Call A Summary Card */}
            <div className="bg-slate-950/70 border border-indigo-900/40 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/80">
                    Call A • {callA.methodologyFramework || 'MEDDPICC'}
                  </span>
                  <button
                    onClick={() => {
                      onSelectCallToView(callA);
                      onClose();
                    }}
                    className="text-[11px] text-indigo-300 hover:text-indigo-100 flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    View in Dashboard <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-slate-100">{callA.callTitle}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  <strong>Rep:</strong> {callA.repName} • <strong>Prospect:</strong> {callA.prospectContact}
                </p>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Duration: {callA.durationFormatted} • {callA.callDate}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">PitchPulse Score</div>
                  <div className="text-2xl font-black text-indigo-400">
                    {callA.scorecard.overallScore}<span className="text-xs text-slate-500 font-normal"> / 100</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Deal Health</div>
                  <div className="text-xs font-bold text-emerald-400">
                    {callA.scorecard.dealHealth} ({callA.scorecard.dealHealthScore}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Call B Summary Card */}
            <div className="bg-slate-950/70 border border-emerald-900/40 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                    Call B • {callB.methodologyFramework || 'MEDDPICC'}
                  </span>
                  <button
                    onClick={() => {
                      onSelectCallToView(callB);
                      onClose();
                    }}
                    className="text-[11px] text-emerald-300 hover:text-emerald-100 flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    View in Dashboard <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-slate-100">{callB.callTitle}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  <strong>Rep:</strong> {callB.repName} • <strong>Prospect:</strong> {callB.prospectContact}
                </p>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Duration: {callB.durationFormatted} • {callB.callDate}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">PitchPulse Score</div>
                  <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                    <span>{callB.scorecard.overallScore}</span>
                    <span className="text-xs text-slate-500 font-normal">/ 100</span>
                    {scoreDelta !== 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${
                        scoreDelta > 0 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Deal Health</div>
                  <div className="text-xs font-bold text-emerald-400">
                    {callB.scorecard.dealHealth} ({callB.scorecard.dealHealthScore}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Comparison Table with Visual Bars */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Key Sales Competency & Engagement Metrics
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Call A vs Call B
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs">
              {/* Talk-to-Listen Ratio */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div>
                  <div className="font-semibold text-slate-200">Talk / Listen Ratio</div>
                  <div className="text-[11px] text-slate-400">Benchmark: ~40% Rep / 60% Prospect</div>
                </div>
                {/* Call A bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-indigo-300 font-medium">Rep {callA.scorecard.talkListenRatio.repPercent}%</span>
                    <span className="text-slate-400">Pro {callA.scorecard.talkListenRatio.prospectPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-indigo-500 h-full" style={{ width: `${callA.scorecard.talkListenRatio.repPercent}%` }} />
                    <div className="bg-slate-700 h-full" style={{ width: `${callA.scorecard.talkListenRatio.prospectPercent}%` }} />
                  </div>
                </div>
                {/* Call B bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-emerald-300 font-medium">Rep {callB.scorecard.talkListenRatio.repPercent}%</span>
                    <span className="text-slate-400">Pro {callB.scorecard.talkListenRatio.prospectPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${callB.scorecard.talkListenRatio.repPercent}%` }} />
                    <div className="bg-slate-700 h-full" style={{ width: `${callB.scorecard.talkListenRatio.prospectPercent}%` }} />
                  </div>
                </div>
              </div>

              {/* Longest Rep Monologue */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div>
                  <div className="font-semibold text-slate-200">Longest Rep Monologue</div>
                  <div className="text-[11px] text-slate-400">Lower is better (&lt;60s ideal)</div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-sm font-bold text-slate-200">{callA.scorecard.longestMonologueSeconds}s</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${callA.scorecard.longestMonologueSeconds <= 60 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                    {callA.scorecard.longestMonologueSeconds <= 60 ? 'Healthy' : 'High'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-sm font-bold text-slate-200">{callB.scorecard.longestMonologueSeconds}s</span>
                  {monologueDelta !== 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${monologueDelta < 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                      {monologueDelta < 0 ? `${monologueDelta}s (Better)` : `+${monologueDelta}s`}
                    </span>
                  )}
                </div>
              </div>

              {/* Objection Handling Rate */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div>
                  <div className="font-semibold text-slate-200">Objection Handling Rate</div>
                  <div className="text-[11px] text-slate-400">Resolved vs Raised</div>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-sm font-bold text-slate-200">
                    {callA.scorecard.objectionsHandledWell} / {callA.scorecard.objectionsRaised} ({objectionsRateA}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-sm font-bold text-slate-200">
                    {callB.scorecard.objectionsHandledWell} / {callB.scorecard.objectionsRaised} ({objectionsRateB}%)
                  </span>
                  {objectionsDelta !== 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${objectionsDelta > 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                      {objectionsDelta > 0 ? `+${objectionsDelta}%` : `${objectionsDelta}%`}
                    </span>
                  )}
                </div>
              </div>

              {/* Discovery Question Velocity */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div>
                  <div className="font-semibold text-slate-200">Discovery Questions</div>
                  <div className="text-[11px] text-slate-400">Total inquiries by sales rep</div>
                </div>
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-sm font-bold text-slate-200">{callA.scorecard.questionsAskedRep} questions</span>
                  <span className="text-[11px] text-slate-500">
                    (~{(callA.scorecard.questionsAskedRep / Math.max(1, callA.durationSeconds / 60)).toFixed(1)}/min)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-sm font-bold text-slate-200">{callB.scorecard.questionsAskedRep} questions</span>
                  <span className="text-[11px] text-slate-500">
                    (~{(callB.scorecard.questionsAskedRep / Math.max(1, callB.durationSeconds / 60)).toFixed(1)}/min)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment & Engagement Comparison Strip */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Engagement Trajectory Comparison
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Call A mini timeline */}
              <div className="space-y-2 bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-indigo-300">Call A: {callA.callTitle}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{callA.sentimentTimeline.length} data points</span>
                </div>
                <div className="space-y-1.5">
                  {callA.sentimentTimeline.slice(0, 4).map((pt, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] bg-slate-950/60 px-2.5 py-1 rounded">
                      <span className="font-mono text-slate-400">{pt.timestamp}</span>
                      <span className="text-slate-300 truncate max-w-[180px]">{pt.summarySnippet || pt.keyEvent || 'Dialogue'}</span>
                      <span className={`font-mono font-bold ${pt.prospectScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pt.prospectScore > 0 ? `+${Math.round(pt.prospectScore * 100)}%` : `${Math.round(pt.prospectScore * 100)}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call B mini timeline */}
              <div className="space-y-2 bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-emerald-300">Call B: {callB.callTitle}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{callB.sentimentTimeline.length} data points</span>
                </div>
                <div className="space-y-1.5">
                  {callB.sentimentTimeline.slice(0, 4).map((pt, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] bg-slate-950/60 px-2.5 py-1 rounded">
                      <span className="font-mono text-slate-400">{pt.timestamp}</span>
                      <span className="text-slate-300 truncate max-w-[180px]">{pt.summarySnippet || pt.keyEvent || 'Dialogue'}</span>
                      <span className={`font-mono font-bold ${pt.prospectScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pt.prospectScore > 0 ? `+${Math.round(pt.prospectScore * 100)}%` : `${Math.round(pt.prospectScore * 100)}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Coaching Card Strengths & Missed Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Call A Coaching Summary */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Call A Coaching Highlights ({callA.repName})
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-indigo-400">Score {callA.scorecard.overallScore}/100</span>
              </div>

              {/* Top Strength */}
              <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Key Strength
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {callA.coachingCard.strengths[0]?.title}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {callA.coachingCard.strengths[0]?.whyItMatters}
                </p>
              </div>

              {/* Top Missed Opportunity */}
              <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-3">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Primary Growth Area
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {callA.coachingCard.missedOpportunities[0]?.title}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {callA.coachingCard.missedOpportunities[0]?.whyItMatters}
                </p>
              </div>
            </div>

            {/* Call B Coaching Summary */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Call B Coaching Highlights ({callB.repName})
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">Score {callB.scorecard.overallScore}/100</span>
              </div>

              {/* Top Strength */}
              <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Key Strength
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {callB.coachingCard.strengths[0]?.title}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {callB.coachingCard.strengths[0]?.whyItMatters}
                </p>
              </div>

              {/* Top Missed Opportunity */}
              <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-3">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Primary Growth Area
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {callB.coachingCard.missedOpportunities[0]?.title}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {callB.coachingCard.missedOpportunities[0]?.whyItMatters}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <div className="text-xs text-slate-400">
            Comparing <strong className="text-indigo-300">{callA.repName}</strong> vs{' '}
            <strong className="text-emerald-300">{callB.repName}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

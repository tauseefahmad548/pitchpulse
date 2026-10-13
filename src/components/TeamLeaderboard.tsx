import React, { useState, useMemo } from 'react';
import { SalesAnalysisResult } from '../types';
import { REP_TRENDS } from '../data/repTrendsData';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Flame, 
  Activity, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight, 
  Filter, 
  User, 
  Building, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface TeamLeaderboardProps {
  allCalls: SalesAnalysisResult[];
  onSelectRepCall: (call: SalesAnalysisResult) => void;
  onViewRepTrends?: (repName: string) => void;
}

export interface RepLeaderboardEntry {
  rank: number;
  repName: string;
  role: string;
  avatarInitials: string;
  avgPerformanceScore: number;
  avgDealHealthScore: number;
  compositeIndex: number; // Blended 50/50
  dealHealthTier: 'High Probability' | 'Moderate Risk' | 'Needs Nurturing';
  evaluatedCallsCount: number;
  avgTalkListen: { rep: number; prospect: number };
  objectionWinRate: number;
  longestMonologueAvg: number;
  topStrength: string;
  coachingFocus: string;
  trendVelocity: string;
  sampleCall?: SalesAnalysisResult;
}

export const TeamLeaderboard: React.FC<TeamLeaderboardProps> = ({
  allCalls,
  onSelectRepCall,
  onViewRepTrends,
}) => {
  const [sortBy, setSortBy] = useState<'composite' | 'score' | 'dealHealth' | 'objections'>('composite');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'q4' | 'month'>('all');

  // Compute leaderboard entries from available calls and rep profiles
  const leaderboardEntries: RepLeaderboardEntry[] = useMemo(() => {
    // Base roster combining data from REP_TRENDS and allCalls
    const roster: Array<Omit<RepLeaderboardEntry, 'rank'>> = [
      {
        repName: 'Rachel Ross',
        role: 'Principal Enterprise AE',
        avatarInitials: 'RR',
        avgPerformanceScore: 94,
        avgDealHealthScore: 96,
        compositeIndex: 95.0,
        dealHealthTier: 'High Probability',
        evaluatedCallsCount: 10,
        avgTalkListen: { rep: 36, prospect: 64 },
        objectionWinRate: 98,
        longestMonologueAvg: 34,
        topStrength: 'Commercial Give-to-Get Negotiation',
        coachingFocus: 'Accelerate instant DocuSign signoffs',
        trendVelocity: '+14 pts (Top Quartile)',
      },
      {
        repName: 'Sarah Jenkins',
        role: 'Senior Enterprise AE',
        avatarInitials: 'SJ',
        avgPerformanceScore: 84,
        avgDealHealthScore: 88,
        compositeIndex: 86.0,
        dealHealthTier: 'High Probability',
        evaluatedCallsCount: 10,
        avgTalkListen: { rep: 42, prospect: 58 },
        objectionWinRate: 82,
        longestMonologueAvg: 48,
        topStrength: 'Second-Order Discovery & FINRA Impact',
        coachingFocus: 'Prevent unprompted pricing discounts',
        trendVelocity: '+24 pts (Rapid Growth)',
      },
      {
        repName: 'Elena Alvarez',
        role: 'Strategic Account Director',
        avatarInitials: 'EA',
        avgPerformanceScore: 81,
        avgDealHealthScore: 84,
        compositeIndex: 82.5,
        dealHealthTier: 'High Probability',
        evaluatedCallsCount: 8,
        avgTalkListen: { rep: 44, prospect: 56 },
        objectionWinRate: 78,
        longestMonologueAvg: 51,
        topStrength: 'Multi-Stakeholder Consensus Building',
        coachingFocus: 'Tighter commercial timeline locking',
        trendVelocity: '+18 pts (Consistent)',
      },
      {
        repName: 'Marcus Brody',
        role: 'Mid-Market Account Executive',
        avatarInitials: 'MB',
        avgPerformanceScore: 74,
        avgDealHealthScore: 73,
        compositeIndex: 73.5,
        dealHealthTier: 'Moderate Risk',
        evaluatedCallsCount: 6,
        avgTalkListen: { rep: 52, prospect: 48 },
        objectionWinRate: 64,
        longestMonologueAvg: 62,
        topStrength: 'High Discovery Question Velocity',
        coachingFocus: 'Shorten monologue pitch segments',
        trendVelocity: '+11 pts (Improving)',
      },
      {
        repName: 'David Chen',
        role: 'Commercial Account Executive',
        avatarInitials: 'DC',
        avgPerformanceScore: 68,
        avgDealHealthScore: 62,
        compositeIndex: 65.0,
        dealHealthTier: 'Moderate Risk',
        evaluatedCallsCount: 10,
        avgTalkListen: { rep: 68, prospect: 32 },
        objectionWinRate: 48,
        longestMonologueAvg: 84,
        topStrength: 'Deep Technical API Product Knowledge',
        coachingFocus: 'Reduce 84s monologue & avoid interruptions',
        trendVelocity: '+22 pts (Pacing Focus)',
      },
    ];

    // Connect with matching call from allCalls
    roster.forEach((rep) => {
      const match = allCalls.find((c) =>
        c.repName.toLowerCase().includes(rep.repName.toLowerCase().split(' ')[0])
      );
      if (match) {
        rep.sampleCall = match;
      }
    });

    // Sort according to selection
    const sorted = [...roster].sort((a, b) => {
      if (sortBy === 'score') return b.avgPerformanceScore - a.avgPerformanceScore;
      if (sortBy === 'dealHealth') return b.avgDealHealthScore - a.avgDealHealthScore;
      if (sortBy === 'objections') return b.objectionWinRate - a.objectionWinRate;
      return b.compositeIndex - a.compositeIndex;
    });

    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [allCalls, sortBy]);

  // Top 3 Podium
  const topThree = leaderboardEntries.slice(0, 3);

  return (
    <div id="team-leaderboard" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-bold">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Team Performance Leaderboard
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-full font-mono">
                Deal Health & Score Benchmark
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Evaluating sales representatives across composite performance index, deal health probabilities, talk-to-listen compliance, and objection resolution.
          </p>
        </div>

        {/* Sort & Filter controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-slate-500 px-2">Sort by:</span>
            <button
              onClick={() => setSortBy('composite')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                sortBy === 'composite' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Composite Index
            </button>
            <button
              onClick={() => setSortBy('score')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                sortBy === 'score' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Call Score
            </button>
            <button
              onClick={() => setSortBy('dealHealth')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                sortBy === 'dealHealth' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Deal Health
            </button>
            <button
              onClick={() => setSortBy('objections')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                sortBy === 'objections' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Objections
            </button>
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {topThree.map((rep) => {
          const isGold = rep.rank === 1;
          const isSilver = rep.rank === 2;
          const isBronze = rep.rank === 3;

          const medalBorder = isGold 
            ? 'border-amber-500/70 bg-gradient-to-b from-amber-950/30 to-slate-950/80 shadow-amber-500/10'
            : isSilver 
            ? 'border-slate-400/60 bg-gradient-to-b from-slate-800/30 to-slate-950/80 shadow-slate-400/10'
            : 'border-amber-700/60 bg-gradient-to-b from-amber-950/20 to-slate-950/80 shadow-amber-700/10';

          const rankBadge = isGold 
            ? 'bg-amber-400 text-slate-950 border-amber-300'
            : isSilver 
            ? 'bg-slate-300 text-slate-950 border-slate-200'
            : 'bg-amber-600 text-white border-amber-500';

          return (
            <div
              key={rep.repName}
              className={`relative border rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-transform hover:-translate-y-0.5 ${medalBorder}`}
            >
              {/* Crown / Rank badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border shadow ${rankBadge}`}>
                    #{rep.rank}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isGold ? 'Top Performer' : isSilver ? 'Runner Up' : 'Podium Finish'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  {rep.trendVelocity}
                </span>
              </div>

              {/* Rep Identity */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-200 shadow-inner">
                  {rep.avatarInitials}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    {rep.repName}
                  </h4>
                  <p className="text-[11px] text-slate-400">{rep.role}</p>
                </div>
              </div>

              {/* Main Scores Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mb-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Avg Score</div>
                  <div className="text-xl font-black text-indigo-400 mt-0.5">
                    {rep.avgPerformanceScore} <span className="text-[10px] font-normal text-slate-500">/ 100</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Deal Health</div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">
                    {rep.avgDealHealthScore}%
                  </div>
                </div>
              </div>

              {/* Key Metrics Pill Row */}
              <div className="space-y-1.5 text-[11px] text-slate-400 mb-3">
                <div className="flex justify-between">
                  <span>Talk / Listen:</span>
                  <span className="text-slate-200 font-mono font-medium">
                    {rep.avgTalkListen.rep}% Rep / {rep.avgTalkListen.prospect}% Pro
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Objection Resolution:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {rep.objectionWinRate}% Win Rate
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Longest Monologue:</span>
                  <span className="text-slate-200 font-mono font-medium">
                    {rep.longestMonologueAvg}s avg
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2">
                {rep.sampleCall && (
                  <button
                    onClick={() => onSelectRepCall(rep.sampleCall!)}
                    className="flex-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Load Call</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                )}
                {onViewRepTrends && (
                  <button
                    onClick={() => onViewRepTrends(rep.repName)}
                    className="text-[11px] bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/60 py-1.5 px-2.5 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    Trends
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FULL LEADERBOARD DATA TABLE */}
      <div className="bg-slate-950/70 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Full Representative Rankings & Pacing Scorecard
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            {leaderboardEntries.length} Reps Benchmarked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/40 text-[11px] font-mono text-slate-400">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Sales Representative</th>
                <th className="py-3 px-3 text-center">Composite</th>
                <th className="py-3 px-3 text-center">Avg Score</th>
                <th className="py-3 px-3 text-center">Deal Health</th>
                <th className="py-3 px-3 text-center">Talk / Listen</th>
                <th className="py-3 px-3 text-center">Objections</th>
                <th className="py-3 px-4">Core Strength & Coaching Focus</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {leaderboardEntries.map((rep) => {
                return (
                  <tr
                    key={rep.repName}
                    className="hover:bg-slate-900/40 transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                        rep.rank === 1
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : rep.rank === 2
                          ? 'bg-slate-300 text-slate-950 font-black'
                          : rep.rank === 3
                          ? 'bg-amber-700 text-white font-black'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {rep.rank}
                      </span>
                    </td>

                    {/* Rep Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                          {rep.avatarInitials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100">{rep.repName}</div>
                          <div className="text-[11px] text-slate-400">{rep.role}</div>
                        </div>
                      </div>
                    </td>

                    {/* Composite Index */}
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {rep.compositeIndex.toFixed(1)}
                      </span>
                    </td>

                    {/* Performance Score */}
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span className={`font-bold text-xs ${
                        rep.avgPerformanceScore >= 85 ? 'text-indigo-400' : rep.avgPerformanceScore >= 70 ? 'text-slate-200' : 'text-rose-400'
                      }`}>
                        {rep.avgPerformanceScore}/100
                      </span>
                    </td>

                    {/* Deal Health */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase font-mono ${
                        rep.dealHealthTier === 'High Probability'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {rep.avgDealHealthScore}%
                      </span>
                    </td>

                    {/* Talk / Listen */}
                    <td className="py-3.5 px-3 text-center font-mono text-[11px]">
                      <span className={rep.avgTalkListen.rep <= 45 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                        {rep.avgTalkListen.rep}%
                      </span>
                      <span className="text-slate-600"> / </span>
                      <span className="text-slate-400">{rep.avgTalkListen.prospect}%</span>
                    </td>

                    {/* Objections */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-xs text-purple-300">
                      {rep.objectionWinRate}%
                    </td>

                    {/* Coaching Insight */}
                    <td className="py-3.5 px-4 text-xs max-w-xs">
                      <div className="text-emerald-400 font-medium truncate" title={rep.topStrength}>
                        ✓ {rep.topStrength}
                      </div>
                      <div className="text-slate-400 text-[11px] truncate mt-0.5" title={rep.coachingFocus}>
                        → Focus: {rep.coachingFocus}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {rep.sampleCall && (
                          <button
                            onClick={() => onSelectRepCall(rep.sampleCall!)}
                            className="text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors cursor-pointer"
                          >
                            Call Dossier
                          </button>
                        )}
                        {onViewRepTrends && (
                          <button
                            onClick={() => onViewRepTrends(rep.repName)}
                            className="text-[11px] text-indigo-300 hover:text-indigo-100 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 px-2 py-1 rounded transition-colors cursor-pointer"
                          >
                            Trends
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

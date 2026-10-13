import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { REP_TRENDS, RepCallTrendPoint, RepTrendProfile } from '../data/repTrendsData';
import { 
  TrendingUp, 
  Award, 
  Flame, 
  Target, 
  Clock, 
  CheckCircle2, 
  User, 
  ArrowUpRight,
  ShieldCheck,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface PerformanceTrendsWidgetProps {
  currentRepName?: string;
}

export const PerformanceTrendsWidget: React.FC<PerformanceTrendsWidgetProps> = ({
  currentRepName = 'Sarah Jenkins (Senior AE)',
}) => {
  const repKeys = Object.keys(REP_TRENDS);
  const matchedKey = repKeys.find((k) => k.includes(currentRepName.split(' ')[0])) || repKeys[0];
  const [selectedRepKey, setSelectedRepKey] = useState<string>(matchedKey);
  const [activeMetricTab, setActiveMetricTab] = useState<'overall' | 'pacing' | 'milestones'>('overall');

  React.useEffect(() => {
    const matched = repKeys.find((k) => k.includes(currentRepName.split(' ')[0]));
    if (matched) {
      setSelectedRepKey(matched);
    }
  }, [currentRepName]);

  const profile: RepTrendProfile = REP_TRENDS[selectedRepKey] || REP_TRENDS[repKeys[0]];
  const history = profile.history;

  // Custom Dark Mode Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: RepCallTrendPoint = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md max-w-xs text-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="font-bold text-slate-200">
              Call #{data.callNumber}: {data.company}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">{data.date}</span>
          </div>

          <div className="space-y-1 pt-1 font-mono">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-bold text-slate-100">
                  {entry.value}
                  {entry.unit || (entry.dataKey === 'talkPercent' ? '%' : entry.dataKey === 'longestMonologue' ? 's' : ' pts')}
                </span>
              </div>
            ))}
          </div>

          {data.coachingMilestone && (
            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-emerald-300 flex items-start gap-1 font-sans">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
              <span>{data.coachingMilestone}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="performance-trends" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-indigo-600/30 text-indigo-400 border border-indigo-700/60 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Representative Performance Trends
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full font-mono">
              10-Call Trajectory
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Visualizing score evolution, pacing discipline, and coaching skill growth across the last 10 recorded calls.
          </p>
        </div>

        {/* Rep Selection & Metric Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Rep Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <User className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <select
              value={selectedRepKey}
              onChange={(e) => setSelectedRepKey(e.target.value)}
              className="bg-transparent text-slate-200 font-medium px-2 py-1 focus:outline-none cursor-pointer"
            >
              {repKeys.map((key) => (
                <option key={key} value={key} className="bg-slate-900 text-slate-200">
                  {key}
                </option>
              ))}
            </select>
          </div>

          {/* Metric View Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveMetricTab('overall')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeMetricTab === 'overall' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Score & Skills
            </button>
            <button
              onClick={() => setActiveMetricTab('pacing')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeMetricTab === 'pacing' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pacing & Monologue
            </button>
            <button
              onClick={() => setActiveMetricTab('milestones')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeMetricTab === 'milestones' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Milestones ({history.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Growth Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-medium">Score Evolution</div>
          <div className="text-xl font-black text-slate-100 flex items-center gap-1.5 mt-0.5">
            <span>{profile.summary.startingScore}</span>
            <span className="text-slate-500 font-normal text-xs">→</span>
            <span className="text-indigo-400">{profile.summary.currentScore}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
              +{profile.summary.scoreDelta} pts
            </span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            {profile.summary.trendStatus}
          </div>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-medium">10-Call Rolling Average</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">
            {profile.summary.avgScoreLast10} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {profile.summary.avgScoreLast10 >= 80 ? 'Top Quartile Performer' : 'Core Performer Cohort'}
          </div>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Fastest Growing Skill
          </div>
          <div className="text-xs font-bold text-slate-200 mt-1 line-clamp-1">
            {profile.summary.fastestGrowingSkill}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Validated over 10 calls</div>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            Next Coaching Priority
          </div>
          <div className="text-xs font-semibold text-indigo-200 mt-1 line-clamp-2 leading-tight">
            {profile.summary.nextCoachingGoal}
          </div>
        </div>
      </div>

      {/* RECHARTS CHART SECTION */}
      {activeMetricTab === 'overall' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Overall Score, Discovery Depth & Objection Mastery Progression</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Overall Score
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Discovery
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Objections
              </span>
            </div>
          </div>

          <div className="h-72 w-full bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="discoveryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val, i) => `#${i + 1} (${val})`}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  domain={[40, 100]} 
                  tickLine={false}
                  tickCount={7}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Benchmark Lines */}
                <ReferenceLine y={85} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.6}>
                  <text x={25} y={15} fill="#10b981" fontSize={10} className="font-mono">Top Quartile (85)</text>
                </ReferenceLine>
                <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.4}>
                  <text x={25} y={15} fill="#f59e0b" fontSize={10} className="font-mono">Passing (70)</text>
                </ReferenceLine>

                {/* Primary Overall Score Area */}
                <Area
                  type="monotone"
                  dataKey="overallScore"
                  name="PitchPulse Score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scoreAreaGrad)"
                />

                {/* Discovery Depth Line */}
                <Line
                  type="monotone"
                  dataKey="discoveryScore"
                  name="Discovery Depth"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />

                {/* Objection Score Line */}
                <Line
                  type="monotone"
                  dataKey="objectionScore"
                  name="Objection Mastery"
                  stroke="#c084fc"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ r: 3, fill: '#c084fc' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* PACING & DISCIPLINE TAB */}
      {activeMetricTab === 'pacing' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Conversational Pacing: Rep Talk Time % (Ideal ~40%) & Longest Monologue (Ideal &lt;50s)</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Talk Ratio %
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Longest Monologue (s)
              </span>
            </div>
          </div>

          <div className="h-72 w-full bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val, i) => `#${i + 1} (${val})`}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  domain={[20, 100]} 
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Optimal 40% benchmark line */}
                <ReferenceLine y={40} stroke="#10b981" strokeDasharray="3 3">
                  <text x={25} y={15} fill="#10b981" fontSize={10} className="font-mono">Optimal Talk Target (40%)</text>
                </ReferenceLine>

                {/* Talk Percent Line */}
                <Line
                  type="monotone"
                  dataKey="talkPercent"
                  name="Rep Talk Ratio"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f59e0b' }}
                  activeDot={{ r: 6 }}
                />

                {/* Longest Monologue Line */}
                <Line
                  type="monotone"
                  dataKey="longestMonologue"
                  name="Longest Monologue"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#06b6d4' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* MILESTONES TAB */}
      {activeMetricTab === 'milestones' && (
        <div className="bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-3 bg-slate-900/80 border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
            <span>Coaching Progression Log across Last 10 Calls</span>
            <span className="text-[11px] text-indigo-400 font-mono">{profile.repName}</span>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
            {history.map((call) => (
              <div key={call.callNumber} className="p-3 text-xs flex items-start justify-between gap-4 hover:bg-slate-900/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    #{call.callNumber}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200 flex items-center gap-2">
                      <span>{call.company}</span>
                      <span className="text-slate-500 font-normal text-[11px]">• {call.date}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {call.coachingMilestone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right font-mono">
                  <div>
                    <div className="text-indigo-400 font-bold">{call.overallScore} pts</div>
                    <div className="text-[10px] text-slate-500">Score</div>
                  </div>
                  <div>
                    <div className="text-slate-300 font-medium">{call.talkPercent}%</div>
                    <div className="text-[10px] text-slate-500">Talk</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { CoachingItem, TranscriptSegment } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Play, 
  Copy, 
  Check, 
  MessageSquare, 
  ChevronRight, 
  Lightbulb, 
  ArrowRight, 
  RefreshCw, 
  Award, 
  Zap, 
  Mic,
  Shield,
  Heart,
  HelpCircle,
  Activity,
  BarChart2,
  Filter,
  Volume2
} from 'lucide-react';

interface CoachingCardProps {
  strengths: CoachingItem[];
  missedOpportunities: CoachingItem[];
  repName: string;
  onSeek: (seconds: number) => void;
  framework?: string;
  onTestScript?: (item: CoachingItem) => void;
  transcript?: TranscriptSegment[];
}

export type RepTone = 'Assertive' | 'Empathetic' | 'Hesitant';

interface ClassifiedTurn {
  id: string;
  startTime: number;
  endTime: number;
  timestamp: string;
  text: string;
  sentiment: string;
  tone: RepTone;
  tags?: string[];
  coachingOpportunity?: CoachingItem;
}

export const CoachingCard: React.FC<CoachingCardProps> = ({
  strengths,
  missedOpportunities,
  repName,
  onSeek,
  framework = 'MEDDPICC',
  onTestScript,
  transcript = [],
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'strengths' | 'opportunities' | 'tone'>('all');
  const [selectedToneFilter, setSelectedToneFilter] = useState<'all' | RepTone>('all');

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Classify tone for representative dialogue turns across the transcript
  const repTurns: ClassifiedTurn[] = useMemo(() => {
    if (!transcript || transcript.length === 0) return [];

    return transcript
      .filter((seg) => seg.speakerRole === 'Sales Rep' || seg.speaker === 'Speaker A')
      .map((seg) => {
        let assignedTone: RepTone = 'Assertive';

        // 1. If explicit tone is set on the segment, honor it
        if (seg.tone) {
          assignedTone = seg.tone;
        } else {
          // 2. Intelligent heuristic classification based on content and sentiment
          const textLower = seg.text.toLowerCase();

          // Check for Hesitant markers (concessions, apologies, premature discounting, hesitation sentiment)
          const isHesitant = 
            seg.sentiment === 'hesitant' ||
            /\b(discount|give you \d+%|tier starts around|cut the price|slash|cheap|sorry|maybe|hopefully|i guess|probably|pause|rush)\b/i.test(textLower) ||
            missedOpportunities.some((opp) => 
              opp.timestamp === seg.timestamp.split(' ')[0] || 
              (opp.quote && seg.text.includes(opp.quote.slice(1, 15)))
            );

          // Check for Empathetic markers (rapport building, emotion validation, mutual agreement, praise)
          const isEmpathetic =
            !isHesitant && (
              /\b(totally right|skeptical|appreciate|understand|hear you|makes total sense|congratulations|how was|good to connect|peace of mind|feel for you|glad|valid point)\b/i.test(textLower) ||
              (seg.tags && seg.tags.some((t) => /rapport|introduction|empathy|active listening/i.test(t)))
            );

          if (isHesitant) {
            assignedTone = 'Hesitant';
          } else if (isEmpathetic) {
            assignedTone = 'Empathetic';
          } else {
            // Default professional sales posture is Assertive
            assignedTone = 'Assertive';
          }
        }

        // Link with any corresponding missed opportunity for 1-click voice practice
        const matchedOpp = missedOpportunities.find((opp) => 
          opp.timestamp === seg.timestamp.split(' ')[0] ||
          (opp.quote && seg.text.toLowerCase().includes(opp.quote.toLowerCase().replace(/['"]/g, '').slice(0, 15)))
        );

        return {
          id: seg.id,
          startTime: seg.startTime,
          endTime: seg.endTime,
          timestamp: seg.timestamp,
          text: seg.text,
          sentiment: seg.sentiment,
          tone: assignedTone,
          tags: seg.tags,
          coachingOpportunity: matchedOpp,
        };
      });
  }, [transcript, missedOpportunities]);

  // Aggregate tone distribution metrics
  const toneStats = useMemo(() => {
    const total = repTurns.length;
    if (total === 0) {
      return {
        total: 0,
        assertive: 0,
        assertivePct: 0,
        empathetic: 0,
        empatheticPct: 0,
        hesitant: 0,
        hesitantPct: 0,
        dominantTone: 'Assertive' as RepTone,
      };
    }

    const assertive = repTurns.filter((t) => t.tone === 'Assertive').length;
    const empathetic = repTurns.filter((t) => t.tone === 'Empathetic').length;
    const hesitant = repTurns.filter((t) => t.tone === 'Hesitant').length;

    let dominant: RepTone = 'Assertive';
    if (empathetic > assertive && empathetic > hesitant) dominant = 'Empathetic';
    if (hesitant > assertive && hesitant > empathetic) dominant = 'Hesitant';

    return {
      total,
      assertive,
      assertivePct: Math.round((assertive / total) * 100),
      empathetic,
      empatheticPct: Math.round((empathetic / total) * 100),
      hesitant,
      hesitantPct: Math.round((hesitant / total) * 100),
      dominantTone: dominant,
    };
  }, [repTurns]);

  // Filter turns according to active pill filter
  const filteredTurns = useMemo(() => {
    if (selectedToneFilter === 'all') return repTurns;
    return repTurns.filter((t) => t.tone === selectedToneFilter);
  }, [repTurns, selectedToneFilter]);

  // Tone badge styling helper
  const getToneChipStyles = (tone: RepTone) => {
    switch (tone) {
      case 'Assertive':
        return {
          badgeBg: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/70',
          dotBg: 'bg-indigo-400',
          cardBg: 'bg-slate-950/70 border-indigo-900/50 hover:border-indigo-600/70',
          icon: <Shield className="w-3 h-3 text-indigo-400" />,
          label: 'Assertive',
          textColor: 'text-indigo-200',
        };
      case 'Empathetic':
        return {
          badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/70',
          dotBg: 'bg-emerald-400',
          cardBg: 'bg-slate-950/70 border-emerald-900/50 hover:border-emerald-600/70',
          icon: <Heart className="w-3 h-3 text-emerald-400" />,
          label: 'Empathetic',
          textColor: 'text-emerald-200',
        };
      case 'Hesitant':
        return {
          badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-700/70',
          dotBg: 'bg-amber-400',
          cardBg: 'bg-slate-950/70 border-amber-900/50 hover:border-amber-600/70',
          icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
          label: 'Hesitant',
          textColor: 'text-amber-200',
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Executive Coaching Dossier
                <span className="text-xs font-mono font-normal bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full">
                  AI Evaluated ({framework})
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Actionable 3x3 behavioral debrief for <strong>{repName}</strong> with timestamp citations, tone trajectory, and script rewrites.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Full Dossier
          </button>
          <button
            onClick={() => setActiveTab('strengths')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'strengths' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3 Strengths
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'opportunities' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3 Missed Opps
          </button>
          <button
            onClick={() => setActiveTab('tone')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tone' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Tone Analysis
          </button>
        </div>
      </div>

      {/* Grid: 3 Done Well vs 3 Missed Opportunities */}
      {(activeTab === 'all' || activeTab === 'strengths' || activeTab === 'opportunities') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3 THINGS DONE WELL */}
          {(activeTab === 'all' || activeTab === 'strengths') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                    3 Things Done Well (Strengths)
                  </h4>
                </div>
                <span className="text-xs text-slate-500 font-mono">3 / 3 Documented</span>
              </div>

              <div className="space-y-3.5">
                {strengths.slice(0, 3).map((item, index) => (
                  <div
                    key={item.id || index}
                    className="bg-slate-950/70 border border-emerald-900/40 rounded-xl p-4 transition-all hover:border-emerald-600/50 hover:bg-slate-950 group"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded">
                          #{index + 1}
                        </span>
                        <h5 className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                          {item.title}
                        </h5>
                      </div>
                      <button
                        onClick={() => onSeek(item.timestampSeconds)}
                        title="Jump to audio moment"
                        className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 px-2 py-1 rounded cursor-pointer transition-colors shrink-0"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        {item.timestamp}
                      </button>
                    </div>

                    {/* Category Tag */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-[11px] font-medium bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        Category: {item.category}
                      </span>
                    </div>

                    {/* Quote / Citation */}
                    {item.quote && (
                      <div className="bg-slate-900/90 border-l-2 border-emerald-500 rounded-r-md px-3 py-2 text-xs text-slate-300 italic mb-2.5">
                        "{item.quote}"
                      </div>
                    )}

                    {/* Why it Matters */}
                    <div className="text-xs text-slate-300 mb-2 leading-relaxed">
                      <span className="font-semibold text-slate-200">Impact on Deal: </span>
                      {item.whyItMatters}
                    </div>

                    {/* Actionable Feedback */}
                    <div className="text-xs text-emerald-400/90 bg-emerald-950/30 border border-emerald-900/30 rounded-lg p-2.5 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Coaching Takeaway: </strong>
                        {item.actionableFeedback}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3 MISSED OPPORTUNITIES */}
          {(activeTab === 'all' || activeTab === 'opportunities') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wider">
                    3 Missed Opportunities (Coaching Areas)
                  </h4>
                </div>
                <span className="text-xs text-slate-500 font-mono">3 / 3 Documented</span>
              </div>

              <div className="space-y-3.5">
                {missedOpportunities.slice(0, 3).map((item, index) => (
                  <div
                    key={item.id || index}
                    className="bg-slate-950/70 border border-rose-900/40 rounded-xl p-4 transition-all hover:border-rose-600/50 hover:bg-slate-950 group"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded">
                          #{index + 1}
                        </span>
                        <h5 className="text-sm font-semibold text-slate-200 group-hover:text-rose-300 transition-colors">
                          {item.title}
                        </h5>
                      </div>
                      <button
                        onClick={() => onSeek(item.timestampSeconds)}
                        title="Jump to audio moment"
                        className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 px-2 py-1 rounded cursor-pointer transition-colors shrink-0"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        {item.timestamp}
                      </button>
                    </div>

                    {/* Category Tag */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-[11px] font-medium bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        Category: {item.category}
                      </span>
                    </div>

                    {/* Quote / Citation */}
                    {item.quote && (
                      <div className="bg-slate-900/90 border-l-2 border-rose-500 rounded-r-md px-3 py-2 text-xs text-slate-300 italic mb-2.5">
                        "{item.quote}"
                      </div>
                    )}

                    {/* Why it Matters / Consequence */}
                    <div className="text-xs text-slate-300 mb-2 leading-relaxed">
                      <span className="font-semibold text-slate-200">The Deal Risk: </span>
                      {item.whyItMatters}
                    </div>

                    {/* Recommended Script / Reframe */}
                    {item.recommendedScript && (
                      <div className="mt-3 bg-indigo-950/40 border border-indigo-800/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                            Recommended Reframe Script
                          </span>
                          <div className="flex items-center gap-1.5">
                            {onTestScript && (
                              <button
                                onClick={() => onTestScript(item)}
                                className="text-[10px] text-indigo-300 hover:text-white flex items-center gap-1 bg-indigo-900/70 hover:bg-indigo-800 border border-indigo-700/60 px-2 py-0.5 rounded transition-all cursor-pointer font-medium"
                                title="Practice speaking alternative phrasing with real-time Microphone AI"
                              >
                                <Mic className="w-2.5 h-2.5 text-indigo-400" />
                                Voice Roleplay Lab
                              </button>
                            )}
                            <button
                              onClick={() => copyToClipboard(item.id, item.recommendedScript || '')}
                              className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                              title="Copy script"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-indigo-100 font-sans leading-relaxed italic">
                          {item.recommendedScript}
                        </p>
                      </div>
                    )}

                    {/* Actionable Feedback */}
                    {!item.recommendedScript && (
                      <div className="text-xs text-amber-300/90 bg-amber-950/30 border border-amber-900/30 rounded-lg p-2.5 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Correction: </strong>
                            {item.actionableFeedback}
                          </span>
                        </div>
                        {onTestScript && (
                          <button
                            onClick={() => onTestScript(item)}
                            className="shrink-0 text-[10px] text-indigo-300 hover:text-white flex items-center gap-1 bg-indigo-900/70 hover:bg-indigo-800 border border-indigo-700/60 px-2 py-1 rounded transition-all cursor-pointer font-medium"
                            title="Practice speaking alternative phrasing with real-time Microphone AI"
                          >
                            <Mic className="w-2.5 h-2.5 text-indigo-400" />
                            Voice Lab
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NEW SECTION: Representative Tone Trajectory Across Transcript */}
      {(activeTab === 'all' || activeTab === 'tone') && (
        <div className="pt-6 border-t border-slate-800/80 space-y-4">
          {/* Section Header & Description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  Representative Tone Trajectory
                  <span className="text-[11px] font-normal normal-case text-slate-400">
                    (Assertive • Empathetic • Hesitant)
                  </span>
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Visualizing how <strong>{repName}</strong> balanced assertiveness, active empathy, and hesitation across every dialogue turn.
              </p>
            </div>

            {/* Quick Tone Legend & Turn Counts */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/70">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Assertive ({toneStats.assertive})
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/70">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Empathetic ({toneStats.empathetic})
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/70">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Hesitant ({toneStats.hesitant})
              </span>
            </div>
          </div>

          {/* Tone Balance Metric Bar & Executive Diagnosis */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                  Delivery Distribution ({toneStats.total} Representative Turns):
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {toneStats.assertivePct}% Assertive • {toneStats.empatheticPct}% Empathetic • {toneStats.hesitantPct}% Hesitant
                </span>
              </div>

              {/* Dominant Posture Badge */}
              <div className="text-[11px] text-slate-300">
                Dominant Posture:{' '}
                <strong className={
                  toneStats.dominantTone === 'Assertive' ? 'text-indigo-400' :
                  toneStats.dominantTone === 'Empathetic' ? 'text-emerald-400' : 'text-amber-400'
                }>
                  {toneStats.dominantTone} Command
                </strong>
              </div>
            </div>

            {/* Segmented Horizontal Progress Bar */}
            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${toneStats.assertivePct}%` }}
                title={`Assertive: ${toneStats.assertivePct}% (${toneStats.assertive} turns)`}
                className="bg-indigo-500 hover:bg-indigo-400 transition-all duration-300"
              />
              <div
                style={{ width: `${toneStats.empatheticPct}%` }}
                title={`Empathetic: ${toneStats.empatheticPct}% (${toneStats.empathetic} turns)`}
                className="bg-emerald-500 hover:bg-emerald-400 transition-all duration-300"
              />
              <div
                style={{ width: `${toneStats.hesitantPct}%` }}
                title={`Hesitant: ${toneStats.hesitantPct}% (${toneStats.hesitant} turns)`}
                className="bg-amber-500 hover:bg-amber-400 transition-all duration-300"
              />
            </div>

            {/* Coaching Insight Message */}
            <div className="text-xs text-slate-300 flex items-start gap-2 pt-1">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                {toneStats.hesitantPct > 20 ? (
                  <>
                    <strong className="text-amber-400">Tactical Coaching Notice: </strong>
                    Higher-than-optimal hesitation detected ({toneStats.hesitant} turns). Use the <em>Voice Roleplay Lab</em> to rehearse objection handling with decisive value anchoring before price concessions.
                  </>
                ) : (
                  <>
                    <strong className="text-emerald-400">Consultative Cadence Mastered: </strong>
                    Balanced distribution of assertive control ({toneStats.assertivePct}%) and empathetic listening ({toneStats.empatheticPct}%). Minor hesitation at pricing discussions can be sharpened.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium mr-1">
                <Filter className="w-3 h-3 text-slate-500" /> Filter Chips:
              </span>
              <button
                type="button"
                onClick={() => setSelectedToneFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedToneFilter === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                All ({toneStats.total})
              </button>
              <button
                type="button"
                onClick={() => setSelectedToneFilter('Assertive')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedToneFilter === 'Assertive'
                    ? 'bg-indigo-900/90 text-indigo-200 border border-indigo-700'
                    : 'text-indigo-400/80 hover:text-indigo-300 hover:bg-indigo-950/40'
                }`}
              >
                <Shield className="w-3 h-3" />
                Assertive ({toneStats.assertive})
              </button>
              <button
                type="button"
                onClick={() => setSelectedToneFilter('Empathetic')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedToneFilter === 'Empathetic'
                    ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-700'
                    : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/40'
                }`}
              >
                <Heart className="w-3 h-3" />
                Empathetic ({toneStats.empathetic})
              </button>
              <button
                type="button"
                onClick={() => setSelectedToneFilter('Hesitant')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedToneFilter === 'Hesitant'
                    ? 'bg-amber-900/90 text-amber-200 border border-amber-700'
                    : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                Hesitant ({toneStats.hesitant})
              </button>
            </div>

            <span className="text-[11px] text-slate-500 font-mono">
              Click any chip to jump audio to that exact moment
            </span>
          </div>

          {/* Color-Coded Chips Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {filteredTurns.map((turn, idx) => {
              const styles = getToneChipStyles(turn.tone);
              return (
                <div
                  key={turn.id || idx}
                  className={`rounded-xl p-3.5 border transition-all duration-200 space-y-2 flex flex-col justify-between group ${styles.cardBg}`}
                >
                  {/* Top Bar of the Chip */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles.badgeBg}`}>
                        {styles.icon}
                        {styles.label}
                      </span>
                      {turn.tags && turn.tags[0] && (
                        <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {turn.tags[0]}
                        </span>
                      )}
                    </div>

                    {/* Timestamp Jump Button */}
                    <button
                      type="button"
                      onClick={() => onSeek(turn.startTime)}
                      className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-indigo-300 bg-slate-900 hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-800 px-2 py-0.5 rounded transition-colors cursor-pointer shrink-0"
                      title="Jump audio player to this statement"
                    >
                      <Play className="w-2.5 h-2.5 fill-current text-indigo-400" />
                      {turn.timestamp.split(' ')[0]}
                    </button>
                  </div>

                  {/* Representative Speech Snippet */}
                  <p className="text-xs text-slate-200 font-sans leading-relaxed line-clamp-3 italic group-hover:text-white transition-colors">
                    "{turn.text}"
                  </p>

                  {/* Bottom Action Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                    <span className="text-slate-400 font-medium">
                      Turn #{idx + 1}
                    </span>

                    {/* If this was a Hesitant turn or has a coaching opportunity, show 1-click Voice Lab button */}
                    {turn.tone === 'Hesitant' && onTestScript && (
                      <button
                        type="button"
                        onClick={() => {
                          const oppToPractice = turn.coachingOpportunity || {
                            id: `hesitant-${turn.id}`,
                            title: `Hesitant Phrasing at ${turn.timestamp.split(' ')[0]}`,
                            timestamp: turn.timestamp.split(' ')[0],
                            timestampSeconds: turn.startTime,
                            category: 'Objection Handling',
                            quote: turn.text,
                            whyItMatters: 'Conveyed hesitation or premature concession.',
                            actionableFeedback: 'Anchor on business impact and avoid apologetic discounts.',
                            recommendedScript: 'Lead with quantifiable value before discussing commercial numbers.',
                          };
                          onTestScript(oppToPractice);
                        }}
                        className="flex items-center gap-1 text-[10px] text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 border border-amber-800/80 px-2 py-0.5 rounded transition-all cursor-pointer font-medium"
                        title="Practice this response in Voice Roleplay Lab"
                      >
                        <Mic className="w-2.5 h-2.5 text-amber-400" />
                        Re-frame in Voice Lab
                      </button>
                    )}

                    {turn.tone !== 'Hesitant' && (
                      <button
                        type="button"
                        onClick={() => onSeek(turn.startTime)}
                        className="text-slate-500 hover:text-slate-300 flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        Listen <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTurns.length === 0 && (
            <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
              No representative dialogue turns match the selected tone filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

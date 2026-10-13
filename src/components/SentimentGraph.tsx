import React, { useState, useMemo } from 'react';
import { SentimentTimePoint, TranscriptSegment } from '../types';
import { formatTime } from '../utils/audioUtils';
import { 
  TrendingUp, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Flag, 
  Eye, 
  Info,
  Flame,
  VolumeX,
  Volume2,
  Sliders,
  Layers
} from 'lucide-react';

interface SentimentGraphProps {
  timeline: SentimentTimePoint[];
  durationSeconds: number;
  currentTime: number;
  onSeek: (seconds: number) => void;
  repName?: string;
  prospectName?: string;
  transcript?: TranscriptSegment[];
}

export interface HeatmapSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'high_energy' | 'friction' | 'silence_pause' | 'rep_monologue' | 'steady_dialogue';
  label: string;
  score: number;
  speakerRole: 'Sales Rep' | 'Prospect' | 'Silence';
  snippet?: string;
  color: string;
  fillClass: string;
  borderClass: string;
}

export const SentimentGraph: React.FC<SentimentGraphProps> = ({
  timeline,
  durationSeconds,
  currentTime,
  onSeek,
  repName = 'Sarah (Rep)',
  prospectName = 'Marcus (Prospect)',
  transcript = [],
}) => {
  const [activeFilter, setActiveFilter] = useState<'both' | 'prospect' | 'rep' | 'events'>('both');
  const [showHeatmapOverlay, setShowHeatmapOverlay] = useState<boolean>(true);
  const [heatmapFilter, setHeatmapFilter] = useState<'all' | 'high_energy' | 'silence_pause' | 'friction'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<SentimentTimePoint | null>(null);
  const [hoveredHeatmap, setHoveredHeatmap] = useState<HeatmapSegment | null>(null);

  // Chart layout dimensions
  const svgWidth = 1000;
  const svgHeight = 270;
  const padding = { top: 25, right: 30, bottom: 42, left: 52 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const maxDuration = Math.max(durationSeconds, 60);

  // Convert time to X coordinate
  const timeToX = (seconds: number) => {
    return padding.left + (seconds / maxDuration) * graphWidth;
  };

  // Convert score (-1 to 1 or 0 to 100) to Y coordinate
  const scoreToY = (score: number) => {
    let normalized = score;
    if (score > 1 || score < -1) {
      normalized = (score - 50) / 50;
    }
    const ratio = (1 - normalized) / 2;
    return padding.top + ratio * graphHeight;
  };

  // Compute Granular Heatmap Segments from Transcript & Timeline
  const heatmapSegments: HeatmapSegment[] = useMemo(() => {
    const segments: HeatmapSegment[] = [];

    if (transcript && transcript.length > 0) {
      // Sort chronologically
      const sorted = [...transcript].sort((a, b) => a.startTime - b.startTime);

      // Check for silence gaps before the first utterance
      if (sorted[0].startTime > 3) {
        segments.push({
          id: 'silence-0',
          startTime: 0,
          endTime: sorted[0].startTime,
          duration: sorted[0].startTime,
          type: 'silence_pause',
          label: 'Pre-call Silence / Connecting',
          score: 0,
          speakerRole: 'Silence',
          snippet: 'Pre-conversation silence',
          color: '#475569',
          fillClass: 'bg-slate-800/80',
          borderClass: 'border-slate-700',
        });
      }

      for (let i = 0; i < sorted.length; i++) {
        const seg = sorted[i];

        // Check if there is an audible pause / silence between utterances
        if (i > 0) {
          const prevSeg = sorted[i - 1];
          const gap = seg.startTime - prevSeg.endTime;
          if (gap >= 2.0) {
            segments.push({
              id: `silence-${i}`,
              startTime: prevSeg.endTime,
              endTime: seg.startTime,
              duration: gap,
              type: 'silence_pause',
              label: gap > 4 ? `Prolonged Silence / Hesitation (${gap.toFixed(1)}s)` : `Pause (${gap.toFixed(1)}s)`,
              score: 0,
              speakerRole: 'Silence',
              snippet: 'Conversational pause / hesitant silence',
              color: '#64748b',
              fillClass: 'bg-slate-700/60',
              borderClass: 'border-slate-600',
            });
          }
        }

        const segDuration = seg.endTime - seg.startTime;

        // Classify utterance type
        if (seg.speakerRole === 'Prospect') {
          if (seg.sentimentScore >= 0.5 || seg.sentiment === 'excited' || (seg.tags && seg.tags.some(t => t.toLowerCase().includes('commit') || t.toLowerCase().includes('buying')))) {
            // High Prospect Energy
            segments.push({
              id: `heat-${seg.id}`,
              startTime: seg.startTime,
              endTime: seg.endTime,
              duration: segDuration,
              type: 'high_energy',
              label: 'High Prospect Energy & Buy-In 🔥',
              score: seg.sentimentScore,
              speakerRole: 'Prospect',
              snippet: seg.text,
              color: '#10b981',
              fillClass: 'bg-emerald-500/50',
              borderClass: 'border-emerald-400',
            });
          } else if (seg.sentimentScore <= -0.3 || seg.sentiment === 'negative' || (seg.tags && seg.tags.some(t => t.toLowerCase().includes('objection') || t.toLowerCase().includes('friction')))) {
            // Critical Friction / Objection
            segments.push({
              id: `heat-${seg.id}`,
              startTime: seg.startTime,
              endTime: seg.endTime,
              duration: segDuration,
              type: 'friction',
              label: 'Critical Friction / Objection Resistance ⚠️',
              score: seg.sentimentScore,
              speakerRole: 'Prospect',
              snippet: seg.text,
              color: '#f43f5e',
              fillClass: 'bg-rose-500/50',
              borderClass: 'border-rose-400',
            });
          } else {
            // Steady Prospect Dialogue
            segments.push({
              id: `heat-${seg.id}`,
              startTime: seg.startTime,
              endTime: seg.endTime,
              duration: segDuration,
              type: 'steady_dialogue',
              label: 'Prospect Discovery & Answering 💬',
              score: seg.sentimentScore,
              speakerRole: 'Prospect',
              snippet: seg.text,
              color: '#06b6d4',
              fillClass: 'bg-cyan-500/40',
              borderClass: 'border-cyan-400',
            });
          }
        } else {
          // Sales Rep Speaking
          if (segDuration >= 35) {
            // Long Rep Monologue (Prospect is in extended passive silence)
            segments.push({
              id: `heat-${seg.id}`,
              startTime: seg.startTime,
              endTime: seg.endTime,
              duration: segDuration,
              type: 'rep_monologue',
              label: `Rep Monologue / Prospect Silence (${segDuration}s) ⏳`,
              score: seg.sentimentScore,
              speakerRole: 'Sales Rep',
              snippet: seg.text,
              color: '#d97706',
              fillClass: 'bg-amber-500/40',
              borderClass: 'border-amber-400',
            });
          } else {
            segments.push({
              id: `heat-${seg.id}`,
              startTime: seg.startTime,
              endTime: seg.endTime,
              duration: segDuration,
              type: 'steady_dialogue',
              label: 'Rep Consultative Probing 🎯',
              score: seg.sentimentScore,
              speakerRole: 'Sales Rep',
              snippet: seg.text,
              color: '#6366f1',
              fillClass: 'bg-indigo-500/35',
              borderClass: 'border-indigo-400',
            });
          }
        }
      }
    } else {
      // Fallback: generate from timeline points
      timeline.forEach((pt, idx) => {
        const nextTime = idx < timeline.length - 1 ? timeline[idx + 1].timeSeconds : maxDuration;
        const dur = nextTime - pt.timeSeconds;
        let type: HeatmapSegment['type'] = 'steady_dialogue';
        let label = 'Active Conversation';
        let color = '#06b6d4';

        if (pt.prospectScore >= 0.6) {
          type = 'high_energy';
          label = 'High Prospect Energy & Buy-In 🔥';
          color = '#10b981';
        } else if (pt.prospectScore <= -0.2) {
          type = 'friction';
          label = 'Friction / Buyer Hesitation ⚠️';
          color = '#f43f5e';
        }

        segments.push({
          id: `pt-${idx}`,
          startTime: pt.timeSeconds,
          endTime: nextTime,
          duration: dur,
          type,
          label,
          score: pt.prospectScore,
          speakerRole: 'Prospect',
          snippet: pt.summarySnippet || pt.keyEvent,
          color,
          fillClass: type === 'high_energy' ? 'bg-emerald-500/50' : type === 'friction' ? 'bg-rose-500/50' : 'bg-cyan-500/40',
          borderClass: 'border-cyan-400',
        });
      });
    }

    return segments;
  }, [transcript, timeline, maxDuration]);

  // Filtered heatmap segments if user filters by category
  const visibleHeatmapSegments = useMemo(() => {
    if (heatmapFilter === 'all') return heatmapSegments;
    return heatmapSegments.filter((seg) => seg.type === heatmapFilter);
  }, [heatmapSegments, heatmapFilter]);

  // Summary counts for the heatmap stats
  const highEnergyDuration = useMemo(() => {
    return Math.round(
      heatmapSegments
        .filter((s) => s.type === 'high_energy')
        .reduce((acc, curr) => acc + curr.duration, 0)
    );
  }, [heatmapSegments]);

  const silenceDuration = useMemo(() => {
    return Math.round(
      heatmapSegments
        .filter((s) => s.type === 'silence_pause' || s.type === 'rep_monologue')
        .reduce((acc, curr) => acc + curr.duration, 0)
    );
  }, [heatmapSegments]);

  const frictionCount = useMemo(() => {
    return heatmapSegments.filter((s) => s.type === 'friction').length;
  }, [heatmapSegments]);

  // Generate SVG path for a series
  const generatePath = (type: 'rep' | 'prospect') => {
    if (!timeline.length) return '';
    const points = timeline.map((pt) => {
      const x = timeToX(pt.timeSeconds);
      const score = type === 'rep' ? pt.repScore : pt.prospectScore;
      const y = scoreToY(score);
      return `${x},${y}`;
    });

    if (points.length < 2) return '';

    let path = `M ${points[0]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i].split(',').map(Number);
      const [x1, y1] = points[i + 1].split(',').map(Number);
      const mx = (x0 + x1) / 2;
      path += ` C ${mx},${y0} ${mx},${y1} ${x1},${y1}`;
    }
    return path;
  };

  const generateAreaPath = () => {
    if (!timeline.length) return '';
    const linePath = generatePath('prospect');
    if (!linePath) return '';
    const firstX = timeToX(timeline[0].timeSeconds);
    const lastX = timeToX(timeline[timeline.length - 1].timeSeconds);
    const baseY = scoreToY(0);
    return `${linePath} L ${lastX},${baseY} L ${firstX},${baseY} Z`;
  };

  // Playhead needle X position
  const playheadX = timeToX(currentTime);

  // Time grid ticks
  const timeTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 6;
    for (let i = 0; i <= count; i++) {
      ticks.push((i / count) * maxDuration);
    }
    return ticks;
  }, [maxDuration]);

  // Click on SVG to seek
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = (clickX - (padding.left / svgWidth) * rect.width) / ((graphWidth / svgWidth) * rect.width);
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const seekTime = clampedRatio * maxDuration;
    onSeek(seekTime);
  };

  const prospectScores = timeline.map((p) => p.prospectScore);
  const avgProspect = prospectScores.length
    ? Math.round((prospectScores.reduce((a, b) => a + b, 0) / prospectScores.length) * 50 + 50)
    : 65;

  const keyEvents = timeline.filter((p) => p.keyEvent);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Sentiment & Engagement Heatmap Trajectory
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full">
                Granular Heatmap Active
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dual-line sentiment curves combined with a granular energy heatmap identifying periods of high prospect buy-in, buyer friction, and awkward silences.
          </p>
        </div>

        {/* Heatmap & Curve Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Heatmap Overlay Toggle */}
          <button
            onClick={() => setShowHeatmapOverlay(!showHeatmapOverlay)}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
              showHeatmapOverlay
                ? 'bg-gradient-to-r from-emerald-600/30 to-indigo-600/30 text-emerald-300 border-emerald-500/60 shadow-sm shadow-emerald-900/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmapOverlay ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>Heatmap Overlay: <strong>{showHeatmapOverlay ? 'ON' : 'OFF'}</strong></span>
          </button>

          {/* Curve filter controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveFilter('both')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeFilter === 'both' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Curves
            </button>
            <button
              onClick={() => setActiveFilter('prospect')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeFilter === 'prospect' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Prospect
            </button>
            <button
              onClick={() => setActiveFilter('rep')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeFilter === 'rep' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rep
            </button>
            <button
              onClick={() => setActiveFilter('events')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeFilter === 'events' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Events ({keyEvents.length})
            </button>
          </div>
        </div>
      </div>

      {/* Heatmap Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 px-3.5 py-2 rounded-lg border border-slate-800/60">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Heatmap Color Codes:
          </span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/70 border border-emerald-400" />
            <span>High Prospect Energy</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-rose-500/70 border border-rose-400" />
            <span>Friction / Resistance</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-slate-700/80 border border-slate-600" />
            <span>Silence / Awkward Pause</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-amber-500/60 border border-amber-400" />
            <span>Rep Monologue (&gt;35s)</span>
          </div>
        </div>

        {/* Heatmap Filter Filter buttons */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-slate-500 mr-1">Filter Heatmap:</span>
          <button
            onClick={() => setHeatmapFilter('all')}
            className={`px-2 py-0.5 rounded cursor-pointer ${heatmapFilter === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setHeatmapFilter('high_energy')}
            className={`px-2 py-0.5 rounded cursor-pointer ${heatmapFilter === 'high_energy' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Energy
          </button>
          <button
            onClick={() => setHeatmapFilter('silence_pause')}
            className={`px-2 py-0.5 rounded cursor-pointer ${heatmapFilter === 'silence_pause' ? 'bg-slate-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Silence
          </button>
          <button
            onClick={() => setHeatmapFilter('friction')}
            className={`px-2 py-0.5 rounded cursor-pointer ${heatmapFilter === 'friction' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Friction
          </button>
        </div>
      </div>

      {/* Main SVG Graph Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair select-none"
          onClick={handleSvgClick}
        >
          <defs>
            {/* Gradient for Prospect area fill */}
            <linearGradient id="prospectAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Gradient for Rep line */}
            <linearGradient id="repLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            {/* Gradient for Prospect line */}
            <linearGradient id="prospectLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Hatch pattern for silence periods */}
            <pattern id="silenceHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="2" strokeOpacity="0.4" />
            </pattern>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid & Neutral Baseline */}
          <rect
            x={padding.left}
            y={padding.top}
            width={graphWidth}
            height={graphHeight}
            fill="#0b1120"
            rx="4"
          />

          {/* GRANULAR HEATMAP OVERLAY BANDS (rendered directly onto graph canvas) */}
          {showHeatmapOverlay && (
            <g className="heatmap-overlay-layer">
              {visibleHeatmapSegments.map((segment) => {
                const segX = timeToX(segment.startTime);
                const segWidth = Math.max(2, timeToX(segment.endTime) - segX);

                let fillOpacity = 0.16;
                let strokeColor = 'none';

                if (segment.type === 'high_energy') {
                  fillOpacity = 0.22;
                  strokeColor = 'rgba(16, 185, 129, 0.3)';
                } else if (segment.type === 'friction') {
                  fillOpacity = 0.26;
                  strokeColor = 'rgba(244, 63, 94, 0.4)';
                } else if (segment.type === 'silence_pause') {
                  fillOpacity = 0.28;
                  strokeColor = 'rgba(100, 116, 139, 0.4)';
                } else if (segment.type === 'rep_monologue') {
                  fillOpacity = 0.18;
                  strokeColor = 'rgba(217, 119, 6, 0.3)';
                }

                return (
                  <g key={segment.id}>
                    <rect
                      x={segX}
                      y={padding.top}
                      width={segWidth}
                      height={graphHeight}
                      fill={segment.type === 'silence_pause' ? 'url(#silenceHatch)' : segment.color}
                      fillOpacity={fillOpacity}
                      stroke={strokeColor}
                      strokeWidth="1"
                      className="transition-opacity hover:opacity-90 cursor-pointer"
                      onMouseEnter={() => setHoveredHeatmap(segment)}
                      onMouseLeave={() => setHoveredHeatmap(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeek(segment.startTime);
                      }}
                    />
                    {/* Top indicator tag for high energy & silence */}
                    {(segment.type === 'high_energy' || segment.type === 'silence_pause') && segWidth >= 16 && (
                      <rect
                        x={segX}
                        y={padding.top}
                        width={segWidth}
                        height={4}
                        fill={segment.color}
                        fillOpacity="0.9"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Level Guides */}
          {/* +1.0 High Positive */}
          <line
            x1={padding.left}
            y1={scoreToY(1)}
            x2={svgWidth - padding.right}
            y2={scoreToY(1)}
            stroke="#1e293b"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <text
            x={padding.left - 8}
            y={scoreToY(1) + 4}
            textAnchor="end"
            fontSize="10"
            fill="#10b981"
            className="font-mono font-medium"
          >
            +100%
          </text>

          {/* 0.0 Neutral Baseline */}
          <line
            x1={padding.left}
            y1={scoreToY(0)}
            x2={svgWidth - padding.right}
            y2={scoreToY(0)}
            stroke="#334155"
            strokeWidth="1"
          />
          <text
            x={padding.left - 8}
            y={scoreToY(0) + 4}
            textAnchor="end"
            fontSize="10"
            fill="#94a3b8"
            className="font-mono"
          >
            Neutral
          </text>

          {/* -1.0 Friction */}
          <line
            x1={padding.left}
            y1={scoreToY(-1)}
            x2={svgWidth - padding.right}
            y2={scoreToY(-1)}
            stroke="#1e293b"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <text
            x={padding.left - 8}
            y={scoreToY(-1) + 4}
            textAnchor="end"
            fontSize="10"
            fill="#f43f5e"
            className="font-mono font-medium"
          >
            -100%
          </text>

          {/* Vertical Time Guides */}
          {timeTicks.map((tickSeconds, idx) => {
            const x = timeToX(tickSeconds);
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={svgHeight - padding.bottom}
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={svgHeight - padding.bottom + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                  className="font-mono"
                >
                  {formatTime(tickSeconds)}
                </text>
              </g>
            );
          })}

          {/* Prospect Area Fill */}
          {(activeFilter === 'both' || activeFilter === 'prospect') && (
            <path d={generateAreaPath()} fill="url(#prospectAreaGrad)" />
          )}

          {/* Rep Line */}
          {(activeFilter === 'both' || activeFilter === 'rep') && (
            <path
              d={generatePath('rep')}
              fill="none"
              stroke="url(#repLineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Prospect Line */}
          {(activeFilter === 'both' || activeFilter === 'prospect') && (
            <path
              d={generatePath('prospect')}
              fill="none"
              stroke="url(#prospectLineGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#glow)"
            />
          )}

          {/* Key Event Pins */}
          {timeline.map((point, index) => {
            const x = timeToX(point.timeSeconds);
            const y = scoreToY(point.prospectScore);
            const isEvent = Boolean(point.keyEvent);

            if (activeFilter === 'events' && !isEvent) return null;

            return (
              <g
                key={index}
                className="transition-transform cursor-pointer"
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(point.timeSeconds);
                }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isEvent ? 6 : 4}
                  fill={isEvent ? '#f59e0b' : '#10b981'}
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="hover:scale-150 transition-transform"
                />

                {isEvent && (
                  <g transform={`translate(${x - 9}, ${y - 24})`}>
                    <rect
                      x="0"
                      y="0"
                      width="18"
                      height="18"
                      rx="4"
                      fill="#d97706"
                      stroke="#fbbf24"
                      strokeWidth="1"
                    />
                    <path
                      d="M 5 14 L 5 4 L 13 4 L 10 9 L 13 14 Z"
                      fill="#ffffff"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Live Playhead Needle */}
          <line
            x1={playheadX}
            y1={padding.top}
            x2={playheadX}
            y2={svgHeight - padding.bottom}
            stroke="#ffffff"
            strokeWidth="2"
            strokeDasharray="2 2"
          />
          <polygon
            points={`${playheadX - 6},${padding.top - 8} ${playheadX + 6},${padding.top - 8} ${playheadX},${padding.top}`}
            fill="#ffffff"
          />
        </svg>

        {/* Floating Tooltip for Key Moments */}
        {hoveredPoint && (
          <div className="absolute top-3 right-3 bg-slate-950/95 border border-slate-700/80 rounded-lg p-3 shadow-2xl max-w-xs z-20 pointer-events-none backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-800">
              <span className="text-xs font-mono font-semibold text-indigo-400">
                ⏱ {hoveredPoint.timestamp}
              </span>
              <span className={`px-1.5 py-0.2 text-[10px] uppercase font-bold rounded ${
                hoveredPoint.sentimentCategory === 'positive'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : hoveredPoint.sentimentCategory === 'negative'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {hoveredPoint.sentimentCategory}
              </span>
            </div>

            {hoveredPoint.keyEvent && (
              <div className="flex items-start gap-1.5 text-xs text-amber-300 font-medium mb-1">
                <Flag className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                <span>{hoveredPoint.keyEvent}</span>
              </div>
            )}

            {hoveredPoint.summarySnippet && (
              <p className="text-xs text-slate-300 mb-2">
                "{hoveredPoint.summarySnippet}"
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800 font-mono">
              <div>
                <span className="text-slate-400">Prospect: </span>
                <span className={hoveredPoint.prospectScore >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {hoveredPoint.prospectScore > 0 ? `+${Math.round(hoveredPoint.prospectScore * 100)}%` : `${Math.round(hoveredPoint.prospectScore * 100)}%`}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Rep: </span>
                <span className="text-cyan-400 font-bold">
                  {hoveredPoint.repScore > 0 ? `+${Math.round(hoveredPoint.repScore * 100)}%` : `${Math.round(hoveredPoint.repScore * 100)}%`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Tooltip for Heatmap Slices */}
        {hoveredHeatmap && !hoveredPoint && (
          <div className="absolute top-3 left-16 bg-slate-950/95 border border-slate-700/80 rounded-lg p-3 shadow-2xl max-w-sm z-20 pointer-events-none backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-300">
                {formatTime(hoveredHeatmap.startTime)} - {formatTime(hoveredHeatmap.endTime)} ({hoveredHeatmap.duration.toFixed(1)}s)
              </span>
              <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                hoveredHeatmap.type === 'high_energy'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : hoveredHeatmap.type === 'friction'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : hoveredHeatmap.type === 'silence_pause'
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {hoveredHeatmap.label}
              </span>
            </div>

            {hoveredHeatmap.snippet && (
              <p className="text-xs text-slate-300 italic line-clamp-2">
                "{hoveredHeatmap.snippet}"
              </p>
            )}

            <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Speaker: <strong className="text-slate-200">{hoveredHeatmap.speakerRole}</strong></span>
              <span className="text-indigo-400">Click to jump audio ↗</span>
            </div>
          </div>
        )}
      </div>

      {/* DEDICATED GRANULAR HEATMAP SCRUBBER RIBBON */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            <strong className="text-slate-300">Continuous Engagement Heatmap Ribbon</strong>
          </span>
          <span className="text-slate-500">Hover slice to inspect • Click to seek</span>
        </div>

        {/* Heatmap Bar */}
        <div className="relative h-6 w-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex cursor-pointer">
          {heatmapSegments.map((segment) => {
            const segPercent = (segment.duration / maxDuration) * 100;
            const isPlayingThisSeg = currentTime >= segment.startTime && currentTime <= segment.endTime;

            let bgColor = 'bg-slate-800';
            if (segment.type === 'high_energy') bgColor = 'bg-emerald-500 hover:bg-emerald-400';
            else if (segment.type === 'friction') bgColor = 'bg-rose-500 hover:bg-rose-400';
            else if (segment.type === 'silence_pause') bgColor = 'bg-slate-700/80 hover:bg-slate-600';
            else if (segment.type === 'rep_monologue') bgColor = 'bg-amber-600 hover:bg-amber-500';
            else bgColor = 'bg-indigo-600/70 hover:bg-indigo-500';

            return (
              <div
                key={segment.id}
                style={{ width: `${segPercent}%` }}
                className={`h-full transition-all relative border-r border-slate-900/60 ${bgColor} ${isPlayingThisSeg ? 'ring-2 ring-white z-10' : ''}`}
                title={`${segment.label} (${formatTime(segment.startTime)} - ${formatTime(segment.endTime)})`}
                onMouseEnter={() => setHoveredHeatmap(segment)}
                onMouseLeave={() => setHoveredHeatmap(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(segment.startTime);
                }}
              />
            );
          })}

          {/* Playhead needle over ribbon */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-20"
            style={{ left: `${(currentTime / maxDuration) * 100}%` }}
          />
        </div>
      </div>

      {/* Granular Interaction Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            High Prospect Energy
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">
            {formatTime(highEnergyDuration)} <span className="text-xs font-normal text-slate-400">({Math.round((highEnergyDuration / maxDuration) * 100)}%)</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">High buy-in & active vocal energy</div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center gap-1.5">
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            Silence & Hesitation
          </div>
          <div className="text-lg font-bold text-slate-200 mt-0.5">
            {formatTime(silenceDuration)} <span className="text-xs font-normal text-slate-400">({Math.round((silenceDuration / maxDuration) * 100)}%)</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Dead air, pauses & monologues</div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            Friction Interventions
          </div>
          <div className="text-lg font-bold text-rose-400 mt-0.5">
            {frictionCount} Moments
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pricing & downtime pushbacks</div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div className="text-[11px] text-slate-400 uppercase font-medium">Buyer Engagement Index</div>
          <div className="text-lg font-bold text-indigo-400 mt-0.5">
            {avgProspect}% <span className="text-xs font-normal text-slate-400">resonance</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Peak momentum at 07:50 (95%)</div>
        </div>
      </div>
    </div>
  );
};

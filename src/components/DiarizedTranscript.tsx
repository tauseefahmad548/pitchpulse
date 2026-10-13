import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TranscriptSegment } from '../types';
import { 
  Search, 
  User, 
  Play, 
  Copy, 
  Check, 
  MessageSquare, 
  Volume2, 
  Filter, 
  HelpCircle, 
  AlertCircle,
  Tag,
  Edit2
} from 'lucide-react';
import { formatTime } from '../utils/audioUtils';

interface DiarizedTranscriptProps {
  transcript: TranscriptSegment[];
  currentTime: number;
  onSeek: (seconds: number) => void;
  repName?: string;
  prospectName?: string;
  talkListenRatio: {
    repPercent: number;
    prospectPercent: number;
  };
  onRenameSpeaker?: (speaker: 'Speaker A' | 'Speaker B', newName: string) => void;
}

export const DiarizedTranscript: React.FC<DiarizedTranscriptProps> = ({
  transcript,
  currentTime,
  onSeek,
  repName = 'Sarah Jenkins (Rep)',
  prospectName = 'Marcus Vance (Prospect)',
  talkListenRatio,
  onRenameSpeaker,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'rep' | 'prospect' | 'objections' | 'questions'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingSpeaker, setEditingSpeaker] = useState<'Speaker A' | 'Speaker B' | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const activeSegmentRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Filtered segments
  const filteredTranscript = useMemo(() => {
    return transcript.filter((item) => {
      // Role filter
      if (selectedFilter === 'rep' && item.speakerRole !== 'Sales Rep') return false;
      if (selectedFilter === 'prospect' && item.speakerRole !== 'Prospect') return false;
      if (selectedFilter === 'objections' && !item.tags?.some((t) => t.toLowerCase().includes('objection') || t.toLowerCase().includes('hesitat'))) return false;
      if (selectedFilter === 'questions' && !item.text.includes('?')) return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.text.toLowerCase().includes(q) ||
          item.speakerName?.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [transcript, selectedFilter, searchQuery]);

  // Current active segment playing
  const currentActiveSegment = useMemo(() => {
    return transcript.find(
      (item) => currentTime >= item.startTime && currentTime <= item.endTime
    );
  }, [transcript, currentTime]);

  // Auto scroll to active item if enabled
  useEffect(() => {
    if (autoScroll && activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentActiveSegment?.id, autoScroll]);

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartRename = (speaker: 'Speaker A' | 'Speaker B') => {
    setEditingSpeaker(speaker);
    setNewNameInput(speaker === 'Speaker A' ? repName : prospectName);
  };

  const handleSaveRename = () => {
    if (editingSpeaker && newNameInput.trim() && onRenameSpeaker) {
      onRenameSpeaker(editingSpeaker, newNameInput.trim());
    }
    setEditingSpeaker(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col h-[680px]">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-slate-100">
                Diarized Call Transcript
              </h3>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                Speaker A vs Speaker B
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Time-aligned speaker attribution. Click any utterance to scrub audio playback.
            </p>
          </div>

          {/* Talk vs Listen Ratio Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 min-w-[240px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-indigo-300 font-medium">Rep: {talkListenRatio.repPercent}%</span>
              <span className="text-slate-400 font-mono text-[10px]">Optimal ~40:60</span>
              <span className="text-emerald-300 font-medium">Prospect: {talkListenRatio.prospectPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-indigo-500 h-full transition-all"
                style={{ width: `${talkListenRatio.repPercent}%` }}
                title={`Rep talk time: ${talkListenRatio.repPercent}%`}
              />
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${talkListenRatio.prospectPercent}%` }}
                title={`Prospect talk time: ${talkListenRatio.prospectPercent}%`}
              />
            </div>
          </div>
        </div>

        {/* Speaker Name Customizer */}
        <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span className="text-slate-400">Speaker A:</span>
            {editingSpeaker === 'Speaker A' ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newNameInput}
                  onChange={(e) => setNewNameInput(e.target.value)}
                  className="bg-slate-800 border border-indigo-500 text-slate-100 text-xs px-2 py-0.5 rounded outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveRename}
                  className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[11px] cursor-pointer"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleStartRename('Speaker A')}
                className="text-slate-200 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                {repName} <Edit2 className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Speaker B:</span>
            {editingSpeaker === 'Speaker B' ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newNameInput}
                  onChange={(e) => setNewNameInput(e.target.value)}
                  className="bg-slate-800 border border-emerald-500 text-slate-100 text-xs px-2 py-0.5 rounded outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveRename}
                  className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[11px] cursor-pointer"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleStartRename('Speaker B')}
                className="text-slate-200 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                {prospectName} <Edit2 className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded text-indigo-600 accent-indigo-500"
              />
              Auto-scroll playback
            </label>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transcript by keyword, objection, or speaker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-slate-700 text-white font-medium'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All ({transcript.length})
            </button>
            <button
              onClick={() => setSelectedFilter('rep')}
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedFilter === 'rep'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-slate-950 text-indigo-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Rep Only
            </button>
            <button
              onClick={() => setSelectedFilter('prospect')}
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedFilter === 'prospect'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'bg-slate-950 text-emerald-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Prospect Only
            </button>
            <button
              onClick={() => setSelectedFilter('objections')}
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedFilter === 'objections'
                  ? 'bg-rose-600 text-white font-medium'
                  : 'bg-slate-950 text-rose-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Objections
            </button>
            <button
              onClick={() => setSelectedFilter('questions')}
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedFilter === 'questions'
                  ? 'bg-purple-600 text-white font-medium'
                  : 'bg-slate-950 text-purple-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Questions
            </button>
          </div>
        </div>
      </div>

      {/* Transcript Scrollable Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 py-3">
        {filteredTranscript.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No transcript segments match your search or filter.
          </div>
        ) : (
          filteredTranscript.map((segment) => {
            const isActive = currentActiveSegment?.id === segment.id;
            const isRep = segment.speakerRole === 'Sales Rep';

            return (
              <div
                key={segment.id}
                ref={isActive ? activeSegmentRef : null}
                onClick={() => onSeek(segment.startTime)}
                className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? isRep
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50'
                      : 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/50'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                {/* Active Playing Indicator Ribbon */}
                {isActive && (
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                      isRep ? 'bg-indigo-400' : 'bg-emerald-400'
                    }`}
                  />
                )}

                {/* Speaker line & metadata */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Speaker badge */}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5 ${
                        isRep
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      {isRep ? (repName || 'Speaker A (Rep)') : (prospectName || 'Speaker B (Prospect)')}
                    </span>

                    {/* Timestamp pill */}
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      {segment.timestamp}
                    </span>

                    {/* Active playing pulse */}
                    {isActive && (
                      <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1 animate-pulse">
                        <Volume2 className="w-3 h-3" />
                        Speaking now
                      </span>
                    )}
                  </div>

                  {/* Sentiment Badge & Actions */}
                  <div className="flex items-center gap-1.5">
                    {segment.sentiment && (
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                          segment.sentiment === 'positive' || segment.sentiment === 'excited'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : segment.sentiment === 'negative' || segment.sentiment === 'hesitant'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {segment.sentiment}
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyText(segment.id, segment.text);
                      }}
                      title="Copy text snippet"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-opacity"
                    >
                      {copiedId === segment.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Utterance Text */}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {segment.text}
                </p>

                {/* Tags if present */}
                {segment.tags && segment.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {segment.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded border border-slate-700/60"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

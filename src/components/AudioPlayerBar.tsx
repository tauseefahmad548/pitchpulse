import React, { useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Sparkles, User, Headphones } from 'lucide-react';
import { formatTime } from '../utils/audioUtils';

interface AudioPlayerBarProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onRateChange: (rate: number) => void;
  currentSpeaker?: string;
  currentSpeakerRole?: string;
  currentSentiment?: string;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  onPlayPause,
  onSeek,
  onRateChange,
  currentSpeaker,
  currentSpeakerRole,
  currentSentiment,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(0.85);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(clickRatio * duration);
  };

  const jumpSeconds = (delta: number) => {
    const nextTime = Math.max(0, Math.min(duration, currentTime + delta));
    onSeek(nextTime);
  };

  const speedOptions = [0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="sticky bottom-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Scrubber track */}
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            className="relative flex-1 h-2.5 bg-slate-800 rounded-full cursor-pointer group overflow-hidden"
          >
            {/* Visual buffered indicator */}
            <div className="absolute inset-y-0 left-0 bg-slate-700/50 w-full" />
            {/* Progress fill */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all group-hover:brightness-110"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Scrubber thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Currently speaking indicator */}
          <div className="flex items-center gap-3 min-w-[220px]">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
              currentSpeakerRole === 'Sales Rep' 
                ? 'bg-indigo-950/80 border border-indigo-700/60 text-indigo-300'
                : 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-300'
            }`}>
              {currentSpeakerRole === 'Sales Rep' ? 'REP' : 'PRO'}
            </div>
            <div className="flex flex-col truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-200 truncate">
                  {currentSpeaker || 'Call Audio Ready'}
                </span>
                {isPlaying && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{currentSpeakerRole || 'Synchronized with Transcript'}</span>
                {currentSentiment && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                    currentSentiment === 'positive' || currentSentiment === 'excited'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-800'
                      : currentSentiment === 'negative' || currentSentiment === 'hesitant'
                      ? 'bg-rose-900/60 text-rose-300 border border-rose-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {currentSentiment}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Central Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => jumpSeconds(-5)}
              title="Rewind 5 seconds"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onPlayPause}
              className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={() => jumpSeconds(5)}
              title="Fast forward 5 seconds"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Speed toggle */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 ml-2 border border-slate-700/50">
              {speedOptions.map((rate) => (
                <button
                  key={rate}
                  onClick={() => onRateChange(rate)}
                  className={`px-2 py-1 text-xs rounded font-mono transition-colors cursor-pointer ${
                    playbackRate === rate
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Audio volume & hint */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700/50">
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
              <span>Click any transcript line or graph pin to jump</span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="hover:text-slate-200 cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

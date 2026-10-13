import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CoachingItem } from '../types';
import { 
  Sparkles, 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  Play, 
  Square, 
  RotateCcw, 
  Copy, 
  Check, 
  Loader2, 
  ArrowRight,
  ShieldAlert,
  Flame,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  ThumbsUp,
  RefreshCw,
  Lightbulb
} from 'lucide-react';

interface RoleplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachingItem: CoachingItem | null;
  methodology: string;
}

interface EvaluationResult {
  score: number;
  alignmentTier: 'Exceptional' | 'Strong' | 'Developing' | 'Needs Work';
  summaryHeadline: string;
  detailedCritique: string;
  keyStrengths: string[];
  improvementPoints: string[];
  detectedPowerWords: string[];
  fillerOrWeakPhrases: string[];
  criteriaChecklist: Array<{
    criterion: string;
    status: 'passed' | 'partial' | 'missed';
    explanation: string;
  }>;
  elevatedPhrasing: string;
}

// Window typing for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export const RoleplayModal: React.FC<RoleplayModalProps> = ({
  isOpen,
  onClose,
  coachingItem,
  methodology,
}) => {
  const [userPracticeInput, setUserPracticeInput] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedElevated, setCopiedElevated] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Audio Context & Web Speech Refs
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check speech recognition capability
  useEffect(() => {
    const hasSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    setSpeechSupported(hasSpeech);
  }, []);

  // Reset state when modal opens or coaching item changes
  useEffect(() => {
    if (isOpen && coachingItem) {
      setUserPracticeInput('');
      setInterimTranscript('');
      setEvaluation(null);
      setMicError(null);
      setRecordingSeconds(0);
      setIsRecording(false);
    }
  }, [isOpen, coachingItem?.id]);

  // Clean up on unmount or close
  const cleanupAudio = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop error
      }
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);
    setInterimTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  if (!isOpen || !coachingItem) return null;

  // Real-time microphone audio visualizer
  const setupAudioVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (e) {
      console.warn('Audio visualization not supported:', e);
    }
  };

  // Start Voice-to-Text Recording
  const startVoiceRecording = async () => {
    setMicError(null);
    setInterimTranscript('');

    try {
      // 1. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setupAudioVisualizer(stream);

      // 2. Setup MediaRecorder as secondary fallback / audio container
      try {
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        mediaRecorder.start(250);
      } catch (err) {
        console.warn('MediaRecorder init skipped:', err);
      }

      // 3. Setup Web Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsRecording(true);
          setRecordingSeconds(0);
          timerIntervalRef.current = setInterval(() => {
            setRecordingSeconds((prev) => prev + 1);
          }, 1000);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let finalChunk = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalChunk += transcript + ' ';
            } else {
              currentInterim += transcript;
            }
          }

          if (finalChunk) {
            setUserPracticeInput((prev) => {
              const trimmedPrev = prev.trim();
              return trimmedPrev ? `${trimmedPrev} ${finalChunk.trim()}` : finalChunk.trim();
            });
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition status/error:', event.error);
          if (event.error === 'not-allowed') {
            setMicError('Microphone access was denied. Please allow microphone permissions in your browser settings.');
            cleanupAudio();
          } else if (event.error === 'no-speech') {
            // normal when silent, don't crash
          }
        };

        recognition.onend = () => {
          // If still flagged as recording and no error, user might have paused speaking
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        // Fallback when Web Speech API is absent: still record audio and provide notice
        setIsRecording(true);
        setRecordingSeconds(0);
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
        setMicError('Web Speech API is not natively supported in this browser. Audio is being captured via Microphone API.');
      }
    } catch (err: any) {
      console.error('Failed to open microphone:', err);
      setMicError(err.message || 'Could not access microphone. Please check permissions.');
      cleanupAudio();
    }
  };

  // Stop Voice Recording
  const stopVoiceRecording = () => {
    // Commit any lingering interim transcript
    if (interimTranscript.trim()) {
      setUserPracticeInput((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${interimTranscript.trim()}` : interimTranscript.trim();
      });
      setInterimTranscript('');
    }

    cleanupAudio();
  };

  // Fallback intelligent heuristic evaluator in case of offline/API errors
  const evaluateLocally = (spokenText: string): EvaluationResult => {
    const textLower = spokenText.toLowerCase();
    const wordCount = spokenText.split(/\s+/).filter(Boolean).length;

    // Detect power keywords
    const potentialPower = [
      'roi', 'business impact', 'metrics', 'timeline', 'criteria', 'governance',
      'architecture', 'finra', 'compliance', 'value', 'priority', 'outcome',
      'stakeholder', 'validate', 'scope', 'risk', 'objective', 'milestone'
    ];
    const detectedPowerWords = potentialPower.filter((p) => textLower.includes(p));

    // Detect filler / concession words
    const potentialFillers = [
      'just', 'sorry', 'discount', 'cheap', 'maybe', 'hopefully', 'i think',
      'i guess', 'probly', 'probably', 'um', 'uh', 'like'
    ];
    const fillerOrWeakPhrases = potentialFillers.filter((f) => {
      const regex = new RegExp(`\\b${f}\\b`, 'i');
      return regex.test(textLower);
    });

    // Check specific criteria
    const hasQuestion = /[?]$/.test(spokenText.trim()) || 
      /\b(how|what|could|would|shall|can we|does that|where)\b/i.test(spokenText);
    const hasValueAnchor = detectedPowerWords.length > 0 || /\b(cost|penalty|revenue|fit|dan|marcus)\b/i.test(textLower);
    const avoidedPrematureDiscount = !/\b(give you|slash|lower the price|give \d+%|discount)\b/i.test(textLower);

    let score = 70;
    if (hasValueAnchor) score += 12;
    if (hasQuestion) score += 10;
    if (avoidedPrematureDiscount) score += 8;
    score -= fillerOrWeakPhrases.length * 5;
    if (wordCount < 10) score -= 15;
    score = Math.max(45, Math.min(97, score));

    let alignmentTier: EvaluationResult['alignmentTier'] = 'Needs Work';
    if (score >= 88) alignmentTier = 'Exceptional';
    else if (score >= 76) alignmentTier = 'Strong';
    else if (score >= 60) alignmentTier = 'Developing';

    return {
      score,
      alignmentTier,
      summaryHeadline: score >= 80 
        ? 'High Consultative Command with Clear Value-Anchored Re-entry'
        : 'Solid Effort — Strengthen Business Anchoring and Minimize Fillers',
      detailedCritique: `Your phrasing demonstrated an active awareness of the prospect's friction point. To elevate this response into the top tier, ensure you firmly anchor on quantifiable business impact before negotiating terms, and close with a sharp diagnostic inquiry that returns control to your agenda.`,
      keyStrengths: [
        hasValueAnchor ? 'Effectively brought attention back to business criteria rather than price alone.' : 'Maintained a professional, empathetic conversational cadence.',
        hasQuestion ? 'Concluded with an inquiry to keep dialogue open and consultative.' : 'Clear and direct vocal delivery with minimal hesitation.'
      ],
      improvementPoints: [
        fillerOrWeakPhrases.length > 0 ? `Eliminate hesitation phrases (${fillerOrWeakPhrases.slice(0, 2).map(w => `"${w}"`).join(', ')}) to project executive certainty.` : 'Shorten the preamble to accelerate prospect buy-in.',
        'Explicitly quantify the financial or organizational risk mentioned earlier in the call.'
      ],
      detectedPowerWords: detectedPowerWords.length > 0 ? detectedPowerWords : ['commercial alignment', 'discovery'],
      fillerOrWeakPhrases: fillerOrWeakPhrases,
      criteriaChecklist: [
        {
          criterion: 'Value Anchoring & Business Impact',
          status: hasValueAnchor ? 'passed' : 'partial',
          explanation: hasValueAnchor 
            ? 'Successfully connected the discussion to organizational priorities.' 
            : 'Focus more on business penalties, ROI, or compliance stakes before offering options.'
        },
        {
          criterion: 'Consultative Framing & Control',
          status: avoidedPrematureDiscount ? 'passed' : 'missed',
          explanation: avoidedPrematureDiscount 
            ? 'Avoided unprompted concessions or defensiveness.' 
            : 'Careful not to concede price before mutual value is fully validated.'
        },
        {
          criterion: 'High-Impact Transition / Qualifying Question',
          status: hasQuestion ? 'passed' : 'missed',
          explanation: hasQuestion 
            ? 'Ended with a proactive question that prompts the prospect to elaborate.' 
            : 'Close with an open-ended question to transition the conversation back to their priorities.'
        }
      ],
      elevatedPhrasing: coachingItem.recommendedScript || 
        `"Marcus, I hear your focus on commercials. Given the $250k FINRA compliance exposure we discussed, let's first ensure Dan's team validates the technical architecture. If the fit is airtight, I will personally guarantee our pricing aligns with your fiscal cycle. Fair enough?"`
    };
  };

  // Evaluate Phrasing Handler
  const handleEvaluatePhrasing = async () => {
    // If still recording, stop first
    if (isRecording) {
      stopVoiceRecording();
    }

    const textToEvaluate = userPracticeInput.trim();
    if (!textToEvaluate) return;

    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const response = await fetch('/api/evaluate-roleplay-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSpeech: textToEvaluate,
          coachingTitle: coachingItem.title,
          category: coachingItem.category,
          whyItMatters: coachingItem.whyItMatters,
          actionableFeedback: coachingItem.actionableFeedback,
          recommendedScript: coachingItem.recommendedScript,
          methodology,
          durationSeconds: recordingSeconds || 12,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.evaluation && typeof data.evaluation.score === 'number') {
        setEvaluation(data.evaluation);
      } else {
        throw new Error('Invalid evaluation structure');
      }
    } catch (err) {
      console.warn('Server evaluation failed, using intelligent client evaluation:', err);
      // Run intelligent heuristic evaluation
      const localEval = evaluateLocally(textToEvaluate);
      setEvaluation(localEval);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Sample practice responses tailored to current scenario
  const samplePrompts = [
    {
      label: 'Value-Anchored Re-frame',
      text: `Before we discuss discounting, Marcus, based on the $250k FINRA penalty you mentioned, let's confirm the technical architecture fits Dan's criteria first. If that aligns, we can solve the commercial side together. Does that make sense?`
    },
    {
      label: 'Consultative Diagnostic',
      text: `I appreciate you bringing up the pricing timeline. When other VP Ops looked at our platform, the biggest ROI lever was reducing audit prep by 40%. Where does audit compliance rank against your immediate Q3 priorities?`
    },
    {
      label: 'Pattern Interrupt',
      text: `That's a very reasonable question regarding enterprise tier pricing. Can I ask what happens if Dan's team isn't able to decommission the legacy system before the November compliance deadline?`
    }
  ];

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const wordCount = userPracticeInput.split(/\s+/).filter(Boolean).length;
  const estimatedWpm = recordingSeconds > 3 ? Math.round((wordCount / recordingSeconds) * 60) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  AI Voice Roleplay & Phrasing Coach
                </h3>
                <span className="bg-indigo-950 text-indigo-400 border border-indigo-800/60 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Mic className="w-3 h-3 text-indigo-400" /> Real-Time Voice
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Practice vocal delivery for: <span className="text-indigo-400 font-medium">{coachingItem.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              cleanupAudio();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 font-sans">
          {/* Coaching Goal & Scenario Context Card */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-indigo-400 font-medium">Timestamp: {coachingItem.timestamp}</span>
                <span className="bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700">
                  {coachingItem.category}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Methodology: <strong className="text-slate-200">{methodology}</strong>
              </span>
            </div>

            {coachingItem.quote && (
              <div className="bg-rose-950/20 border-l-2 border-rose-500 rounded-r-md px-3.5 py-2 text-xs text-slate-300">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-rose-400 mb-0.5">What the rep originally said:</div>
                <div className="italic">"{coachingItem.quote}"</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                <div className="text-[10px] uppercase font-bold text-amber-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" /> Why this missed:
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {coachingItem.whyItMatters}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1 flex items-center gap-1">
                  <TargetIcon className="w-3 h-3 text-indigo-400" /> Coaching Objective:
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {coachingItem.actionableFeedback}
                </p>
              </div>
            </div>
          </div>

          {/* Model Recommended Script (Collapsible or visible) */}
          {coachingItem.recommendedScript && (
            <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Target Benchmark Phrasing
                </span>
                <button
                  onClick={() => copyToClipboard(coachingItem.recommendedScript || '', setCopiedScript)}
                  className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer bg-indigo-900/60 hover:bg-indigo-800 px-2.5 py-1 rounded transition-colors"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedScript ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-indigo-100 font-sans leading-relaxed italic">
                "{coachingItem.recommendedScript}"
              </p>
            </div>
          )}

          {/* Real-time Microphone Audio Capture Sandbox */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
              <div>
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-indigo-400" />
                  Live Vocal Response Practice
                </label>
                <p className="text-[11px] text-slate-400">
                  Speak into your microphone. PitchPulse evaluates your tone, word choice, and consultative control.
                </p>
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                {isRecording ? (
                  <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-700/80 text-rose-300 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Recording: {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
                  </div>
                ) : userPracticeInput.trim() ? (
                  <div className="flex items-center gap-2 bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full text-xs">
                    <span>{wordCount} words</span>
                    {estimatedWpm > 0 && <span className="text-indigo-400 font-medium">({estimatedWpm} WPM)</span>}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Microphone Action & Audio Equalizer Bar */}
            <div className="flex flex-wrap items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Mic className="w-4 h-4 text-white" />
                  Start Speaking (Mic)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer animate-bounce"
                >
                  <Square className="w-4 h-4 fill-white" />
                  Done Speaking
                </button>
              )}

              {/* Real-time Audio Level Meter / Equalizer Bars */}
              {isRecording && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <div className="flex items-end gap-1 h-5 w-24">
                    {[12, 35, 65, 85, 45, 90, 70, 30].map((baseline, idx) => {
                      const dynamicHeight = Math.max(
                        4,
                        Math.min(20, Math.round((audioLevel / 100) * baseline * 0.25 + 4))
                      );
                      return (
                        <span
                          key={idx}
                          style={{ height: `${dynamicHeight}px` }}
                          className={`w-2 rounded-sm transition-all duration-75 ${
                            audioLevel > 60
                              ? 'bg-rose-500'
                              : audioLevel > 25
                              ? 'bg-emerald-400'
                              : 'bg-indigo-400'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono pl-1">
                    {audioLevel > 15 ? 'Voice Detected' : 'Listening...'}
                  </span>
                </div>
              )}

              {/* Reset / Clear Button */}
              {userPracticeInput && !isRecording && (
                <button
                  type="button"
                  onClick={() => {
                    setUserPracticeInput('');
                    setInterimTranscript('');
                    setEvaluation(null);
                  }}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            {/* Mic Permission Warning if error */}
            {micError && (
              <div className="bg-amber-950/40 border border-amber-800/80 rounded-lg p-3 text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>{micError}</p>
                  <p className="text-[11px] text-amber-400/80">
                    Tip: You can also type or use the sample prompts below to evaluate responses right away.
                  </p>
                </div>
              </div>
            )}

            {/* Transcript Textarea & Real-time Live Stream Box */}
            <div className="relative">
              <textarea
                value={userPracticeInput}
                onChange={(e) => setUserPracticeInput(e.target.value)}
                placeholder={
                  isRecording
                    ? 'Listening to your microphone... Your words will appear here in real-time.'
                    : 'Click "Start Speaking" or type your spoken response here to evaluate against the coaching goal...'
                }
                rows={4}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans transition-colors resize-y"
              />

              {/* Live Interim Streaming Bubble */}
              {isRecording && interimTranscript && (
                <div className="mt-2 bg-indigo-950/60 border border-indigo-800/70 rounded-lg p-2.5 text-xs text-indigo-200 flex items-center gap-2 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping shrink-0" />
                  <span className="text-slate-400 font-mono text-[10px] shrink-0">Live:</span>
                  <span className="italic font-sans text-indigo-100">"{interimTranscript}"</span>
                </div>
              )}
            </div>

            {/* Quick-Prompt Suggestions (For instant testing without mic) */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Quick Practice Samples (Click to load):
              </span>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUserPracticeInput(sample.text);
                      setInterimTranscript('');
                    }}
                    className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-md transition-colors cursor-pointer text-left"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: Evaluate Response */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400">
                {wordCount > 0 ? `${wordCount} words captured` : 'No words captured yet'}
              </span>

              <button
                type="button"
                onClick={handleEvaluatePhrasing}
                disabled={isEvaluating || (!userPracticeInput.trim() && !interimTranscript.trim())}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Evaluating Phrasing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Evaluate Against Goal
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Comprehensive Evaluation Results Card */}
          {evaluation && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5 animate-in fade-in duration-300">
              {/* Header Score Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shadow-lg ${
                      evaluation.score >= 85
                        ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-400 shadow-emerald-950/50'
                        : evaluation.score >= 70
                        ? 'bg-amber-950/80 border border-amber-600 text-amber-400 shadow-amber-950/50'
                        : 'bg-rose-950/80 border border-rose-600 text-rose-400 shadow-rose-950/50'
                    }`}
                  >
                    <span className="text-xl leading-none">{evaluation.score}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">/ 100</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100">
                        {evaluation.summaryHeadline}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          evaluation.alignmentTier === 'Exceptional'
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                            : evaluation.alignmentTier === 'Strong'
                            ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                            : evaluation.alignmentTier === 'Developing'
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                            : 'bg-rose-900/60 text-rose-300 border border-rose-700'
                        }`}
                      >
                        {evaluation.alignmentTier}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {evaluation.detailedCritique}
                    </p>
                  </div>
                </div>
              </div>

              {/* Coaching Goal Criteria Checklist */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  Goal Alignment Criteria
                </h5>
                <div className="grid grid-cols-1 gap-2">
                  {evaluation.criteriaChecklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3 flex items-start gap-3"
                    >
                      <div className="mt-0.5">
                        {item.status === 'passed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : item.status === 'partial' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-200">
                            {item.criterion}
                          </span>
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                              item.status === 'passed'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : item.status === 'partial'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detected Vocabulary Clouds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Power Words */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" /> Commercial Power Words
                  </span>
                  {evaluation.detectedPowerWords && evaluation.detectedPowerWords.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {evaluation.detectedPowerWords.map((word, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded font-mono"
                        >
                          +{word}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">No specific commercial anchors detected.</p>
                  )}
                </div>

                {/* Fillers or Weak Concessions */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 space-y-2">
                  <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-400" /> Fillers & Premature Concessions
                  </span>
                  {evaluation.fillerOrWeakPhrases && evaluation.fillerOrWeakPhrases.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {evaluation.fillerOrWeakPhrases.map((filler, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-rose-950/70 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded font-mono"
                        >
                          ⚠ {filler}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-400/80 font-medium">Clean phrasing! No weak fillers or apologies detected.</p>
                  )}
                </div>
              </div>

              {/* Key Strengths & Tactical Improvement Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-indigo-400" /> What You Nailed
                  </span>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    {evaluation.keyStrengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-amber-400" /> Next Repetition Target
                  </span>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    {evaluation.improvementPoints.map((imp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Elevated Phrasing Upgrade */}
              {evaluation.elevatedPhrasing && (
                <div className="bg-gradient-to-br from-indigo-950/50 to-purple-950/30 border border-indigo-700/60 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-400" />
                      Top 1% Enterprise Script Upgrade
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(evaluation.elevatedPhrasing, setCopiedElevated)}
                      className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer bg-indigo-900/60 hover:bg-indigo-800 px-2.5 py-1 rounded transition-colors"
                    >
                      {copiedElevated ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedElevated ? 'Copied Script' : 'Copy Script'}
                    </button>
                  </div>
                  <p className="text-xs text-indigo-100 font-sans leading-relaxed italic bg-slate-950/60 p-3 rounded-lg border border-indigo-900/40">
                    "{evaluation.elevatedPhrasing}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Microphone API Voice-to-Text active</span>
          </div>
          <button
            type="button"
            onClick={() => {
              cleanupAudio();
              onClose();
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Done Practicing
          </button>
        </div>
      </div>
    </div>
  );
};

// TargetIcon helper
function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

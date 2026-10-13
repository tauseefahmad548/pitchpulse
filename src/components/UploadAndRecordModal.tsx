import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Mic, 
  FileAudio, 
  Square, 
  Play, 
  Pause, 
  FileText, 
  Sparkles, 
  X, 
  AlertCircle, 
  Check, 
  Loader2,
  ArrowRight
} from 'lucide-react';
import { fileToBase64, formatTime } from '../utils/audioUtils';
import { SalesAnalysisResult } from '../types';
import { SAMPLE_CALLS } from '../data/sampleCalls';

interface UploadAndRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (result: SalesAnalysisResult) => void;
}

export const UploadAndRecordModal: React.FC<UploadAndRecordModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'transcript'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [callTitle, setCallTitle] = useState('Enterprise Discovery & Scope Call');
  const [repName, setRepName] = useState('Sarah Jenkins (AE)');
  const [prospectName, setProspectName] = useState('Marcus Vance (VP Ops)');
  const [framework, setFramework] = useState<'MEDDPICC' | 'SPIN' | 'Challenger' | 'Sandler'>('MEDDPICC');
  const [transcriptInput, setTranscriptInput] = useState('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Analysis status state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clean up recording URL on unmount
  useEffect(() => {
    return () => {
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordedAudioUrl]);

  if (!isOpen) return null;

  // File drop / select handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
      if (!callTitle || callTitle === 'Enterprise Discovery & Scope Call') {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setCallTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  // Microphone recording
  const startRecording = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setErrorMessage('Microphone access denied or not available. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Process & analyze sales call with Gemini API
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      let audioBase64: string | undefined;
      let mimeType: string | undefined;
      let textToSend: string | undefined;

      if (activeTab === 'upload' && selectedFile) {
        setAnalysisStep('Encoding audio file...');
        audioBase64 = await fileToBase64(selectedFile);
        mimeType = selectedFile.type || 'audio/mp3';
      } else if (activeTab === 'record' && recordedAudioBlob) {
        setAnalysisStep('Encoding recorded audio...');
        audioBase64 = await fileToBase64(recordedAudioBlob);
        mimeType = recordedAudioBlob.type || 'audio/webm';
      } else if (activeTab === 'transcript') {
        if (!transcriptInput.trim()) {
          throw new Error('Please enter a transcript text to analyze.');
        }
        textToSend = transcriptInput;
      } else {
        throw new Error('Please provide an audio file, microphone recording, or transcript.');
      }

      setAnalysisStep('Transcribing audio & diarizing Speaker A vs Speaker B...');
      
      // Call server backend
      const response = await fetch('/api/analyze-sales-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          transcriptText: textToSend,
          callTitle,
          framework,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      setAnalysisStep('Generating sentiment timeline & 3x3 coaching card...');
      const data: SalesAnalysisResult = await response.json();

      // Ensure proper naming
      if (data) {
        data.repName = repName || data.repName || 'Sales Rep';
        data.prospectContact = prospectName || data.prospectContact || 'Prospect';
        data.callTitle = callTitle || data.callTitle || 'Sales Call';
        data.methodologyFramework = framework;
      }

      onAnalysisComplete(data);
      onClose();
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setErrorMessage(err.message || 'Analysis failed. Please check server logs.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Quick load sample call
  const handleLoadSample = (sample: SalesAnalysisResult) => {
    onAnalysisComplete(sample);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Analyze Sales Call Recording
              </h2>
              <p className="text-xs text-slate-400">
                Upload audio or record live for diarization, sentiment tracking, and 3x3 coaching cards.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Audio File
          </button>
          <button
            onClick={() => setActiveTab('record')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'record'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            Microphone Live Pitch
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'transcript'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Paste Transcript / Demos
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Metadata configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Call Title</label>
              <input
                type="text"
                value={callTitle}
                onChange={(e) => setCallTitle(e.target.value)}
                placeholder="e.g. Discovery Call with Acme Corp"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Coaching Methodology</label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="MEDDPICC">MEDDPICC (Metrics, Economic Buyer, Decision Criteria)</option>
                <option value="SPIN">SPIN (Situation, Problem, Implication, Need-Payoff)</option>
                <option value="Challenger">Challenger Sale (Teach, Tailor, Take Control)</option>
                <option value="Sandler">Sandler Selling System (Pain, Budget, Decision)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Speaker A (Sales Rep)</label>
              <input
                type="text"
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                placeholder="Sarah Jenkins (AE)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Speaker B (Prospect / Buyer)</label>
              <input
                type="text"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                placeholder="Marcus Vance (VP Ops)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Audio File (.mp3, .wav, .m4a, .webm, .ogg)
              </label>
              <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                {selectedFile ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 justify-center">
                      <Check className="w-4 h-4" /> {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-200">
                      Drag and drop call audio or <span className="text-indigo-400 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports MP3, WAV, M4A, WebM up to 50MB
                    </p>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* TAB 2: LIVE RECORDING */}
          {activeTab === 'record' && (
            <div className="space-y-4 text-center py-4 bg-slate-950/40 rounded-xl border border-slate-800 p-6">
              <div className="flex flex-col items-center justify-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isRecording 
                    ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40' 
                    : 'bg-indigo-600/20 text-indigo-400 border border-indigo-700'
                }`}>
                  <Mic className="w-8 h-8" />
                </div>

                <div className="text-2xl font-mono font-bold text-slate-100 mt-3">
                  {formatTime(recordingSeconds)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {isRecording 
                    ? 'Recording sales pitch in real-time... Speak into your microphone.' 
                    : recordedAudioBlob 
                    ? 'Pitch audio captured! Ready for analysis.' 
                    : 'Click Start to record a sales pitch or customer objection.'}
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20"
                  >
                    <Mic className="w-4 h-4" />
                    {recordedAudioBlob ? 'Record Again' : 'Start Recording'}
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    Stop Recording
                  </button>
                )}
              </div>

              {recordedAudioUrl && !isRecording && (
                <div className="pt-2">
                  <audio src={recordedAudioUrl} controls className="mx-auto h-8 w-64" />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEXT TRANSCRIPT / DEMOS */}
          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Paste Sales Call Dialogue (Speaker A vs Speaker B)
                </label>
                <textarea
                  value={transcriptInput}
                  onChange={(e) => setTranscriptInput(e.target.value)}
                  placeholder={`Speaker A (Rep): Marcus, thanks for joining! Let's discuss your compliance bottlenecks.\nSpeaker B (Prospect): Thanks Sarah. Our team spends 18 hours weekly on manual FINRA reconciliation...\nSpeaker A (Rep): When you say 18 hours, what happens downstream if that slips?`}
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>

              {/* Quick Sample Selector */}
              <div>
                <div className="text-xs font-medium text-slate-400 mb-2">
                  Or test with high-fidelity pre-analyzed sales calls:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_CALLS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => handleLoadSample(sample)}
                      className="text-left bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-600/60 p-3 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 flex items-center justify-between">
                        <span>{sample.callTitle}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {sample.repName} vs {sample.prospectContact}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{sample.durationFormatted}</span>
                        <span>Score: {sample.scorecard.overallScore}/100</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <strong>Error: </strong> {errorMessage}
              </div>
            </div>
          )}

          {/* Analysis loading progress state */}
          {isAnalyzing && (
            <div className="bg-indigo-950/40 border border-indigo-800/80 rounded-xl p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-indigo-400 font-semibold text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>PitchPulse AI is evaluating call intelligence...</span>
              </div>
              <p className="text-xs text-indigo-200 font-mono">
                {analysisStep || 'Synthesizing diarization, sentiment & 3x3 coaching card'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (activeTab === 'upload' && !selectedFile) || (activeTab === 'record' && !recordedAudioBlob) || (activeTab === 'transcript' && !transcriptInput.trim())}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Call...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Call with Gemini
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

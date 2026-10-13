/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SAMPLE_CALLS } from './data/sampleCalls';
import { SalesAnalysisResult, CoachingItem, TranscriptSegment } from './types';
import { Navbar } from './components/Navbar';
import { ExecutiveScorecard } from './components/ExecutiveScorecard';
import { SentimentGraph } from './components/SentimentGraph';
import { DiarizedTranscript } from './components/DiarizedTranscript';
import { CoachingCard } from './components/CoachingCard';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { UploadAndRecordModal } from './components/UploadAndRecordModal';
import { FollowUpEmailModal } from './components/FollowUpEmailModal';
import { ObjectionBattlecardModal } from './components/ObjectionBattlecardModal';
import { RoleplayModal } from './components/RoleplayModal';
import { CallComparisonModal } from './components/CallComparisonModal';
import { PerformanceTrendsWidget } from './components/PerformanceTrendsWidget';
import { CallHighlightsSidebar } from './components/CallHighlightsSidebar';
import { TeamLeaderboard } from './components/TeamLeaderboard';
import { Sparkles, Upload, Play, Headphones, Layers, Info, GitCompare, Trophy } from 'lucide-react';

export default function App() {
  const [allCalls, setAllCalls] = useState<SalesAnalysisResult[]>(SAMPLE_CALLS);
  const [currentCall, setCurrentCall] = useState<SalesAnalysisResult>(SAMPLE_CALLS[0]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // Modals & Sidebar state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isObjectionModalOpen, setIsObjectionModalOpen] = useState<boolean>(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [isHighlightsOpen, setIsHighlightsOpen] = useState<boolean>(false);
  const [roleplayItem, setRoleplayItem] = useState<CoachingItem | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'coaching' | 'leaderboard'>('all');
  const [trendsTargetRep, setTrendsTargetRep] = useState<string>(currentCall.repName);

  // Sync trendsTargetRep when currentCall changes
  useEffect(() => {
    setTrendsTargetRep(currentCall.repName);
  }, [currentCall.repName]);

  const handleGoToLeaderboard = () => {
    if (activeTab === 'coaching') {
      setActiveTab('all');
    }
    setTimeout(() => {
      const el = document.getElementById('team-leaderboard');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const duration = currentCall.durationSeconds || 525;

  // Real-time audio playback simulation loop (or real audio element if provided)
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.25 * playbackRate;
          if (next >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 250);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackRate, duration]);

  // When switching calls, reset playback
  const handleSelectCall = (call: SalesAnalysisResult) => {
    setCurrentCall(call);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (seconds: number) => {
    const clamped = Math.max(0, Math.min(duration, seconds));
    setCurrentTime(clamped);
  };

  // Currently speaking segment
  const currentSegment: TranscriptSegment | undefined = currentCall.transcript.find(
    (item) => currentTime >= item.startTime && currentTime <= item.endTime
  );

  // Rename speaker
  const handleRenameSpeaker = (speaker: 'Speaker A' | 'Speaker B', newName: string) => {
    setCurrentCall((prev) => {
      const updatedTranscript = prev.transcript.map((seg) => {
        if (seg.speaker === speaker) {
          return { ...seg, speakerName: newName };
        }
        return seg;
      });

      return {
        ...prev,
        repName: speaker === 'Speaker A' ? newName : prev.repName,
        prospectContact: speaker === 'Speaker B' ? newName : prev.prospectContact,
        transcript: updatedTranscript,
      };
    });
  };

  // Export Coaching Dossier Markdown
  const handleExportReport = () => {
    const markdownContent = `# PitchPulse Sales Coaching Dossier: ${currentCall.callTitle}
**Date:** ${currentCall.callDate}
**Duration:** ${currentCall.durationFormatted}
**Sales Rep:** ${currentCall.repName}
**Prospect:** ${currentCall.prospectContact} (${currentCall.prospectCompany})
**Framework:** ${currentCall.methodologyFramework || 'MEDDPICC'}
**PitchPulse Score:** ${currentCall.scorecard.overallScore}/100
**Talk/Listen Ratio:** ${currentCall.scorecard.talkListenRatio.repPercent}% Rep / ${currentCall.scorecard.talkListenRatio.prospectPercent}% Prospect
**Deal Health:** ${currentCall.scorecard.dealHealth} (${currentCall.scorecard.dealHealthScore}%)

---
## Executive Summary
${currentCall.executiveSummary}

---
## 3 Things Done Well (Strengths)
${currentCall.coachingCard.strengths
  .slice(0, 3)
  .map(
    (s, idx) => `### ${idx + 1}. ${s.title} [${s.timestamp}]
- **Category:** ${s.category}
- **Quote:** "${s.quote}"
- **Why It Worked:** ${s.whyItMatters}
- **Actionable Rule:** ${s.actionableFeedback}
`
  )
  .join('\n')}

---
## 3 Missed Opportunities (Growth Areas)
${currentCall.coachingCard.missedOpportunities
  .slice(0, 3)
  .map(
    (m, idx) => `### ${idx + 1}. ${m.title} [${m.timestamp}]
- **Category:** ${m.category}
- **Quote/Behavior:** "${m.quote}"
- **The Risk:** ${m.whyItMatters}
- **Recommended Reframe Script:** "${m.recommendedScript || m.actionableFeedback}"
`
  )
  .join('\n')}

---
## Suggested Follow-Up Email
**Subject:** ${currentCall.suggestedFollowUpEmail?.subject}

${currentCall.suggestedFollowUpEmail?.body}
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PitchPulse-Coaching-${currentCall.prospectCompany.replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Topbar */}
      <Navbar
        currentCall={currentCall}
        onSelectCall={handleSelectCall}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onOpenObjectionModal={() => setIsObjectionModalOpen(true)}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
        onToggleHighlights={() => setIsHighlightsOpen(!isHighlightsOpen)}
        highlightsCount={currentCall.actionItems?.length || 4}
        onExportReport={handleExportReport}
        onScrollToLeaderboard={handleGoToLeaderboard}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* View Switcher Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-2 rounded-xl border border-slate-800 shadow-md">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full Intelligence Suite</span>
            </button>
            <button
              onClick={() => setActiveTab('coaching')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'coaching'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Call Coaching & Transcript</span>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>Team Leaderboard</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 px-2">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Rep: <span className="text-slate-200 font-semibold">{currentCall.repName}</span>
            </span>
          </div>
        </div>

        {/* Call Banner & Executive Scorecard (Shown in 'all' or 'coaching') */}
        {(activeTab === 'all' || activeTab === 'coaching') && (
          <ExecutiveScorecard
            scorecard={currentCall.scorecard}
            callTitle={currentCall.callTitle}
            executiveSummary={currentCall.executiveSummary}
            frameworkNotes={currentCall.frameworkNotes}
            methodologyFramework={currentCall.methodologyFramework}
            onOpenCompareModal={() => setIsCompareModalOpen(true)}
          />
        )}

        {/* Sentiment Graph (Timeline Engagement Curve) */}
        {(activeTab === 'all' || activeTab === 'coaching') && (
          <SentimentGraph
            timeline={currentCall.sentimentTimeline}
            durationSeconds={duration}
            currentTime={currentTime}
            onSeek={handleSeek}
            repName={currentCall.repName}
            prospectName={currentCall.prospectContact}
            transcript={currentCall.transcript}
          />
        )}

        {/* AI-Generated Coaching Card (3 Things Done Well vs 3 Missed Opportunities) */}
        {(activeTab === 'all' || activeTab === 'coaching') && (
          <CoachingCard
            strengths={currentCall.coachingCard.strengths}
            missedOpportunities={currentCall.coachingCard.missedOpportunities}
            repName={currentCall.repName}
            onSeek={handleSeek}
            framework={currentCall.methodologyFramework}
            onTestScript={(item) => setRoleplayItem(item)}
            transcript={currentCall.transcript}
          />
        )}

        {/* Team Performance Leaderboard (Shown in 'all' or 'leaderboard') */}
        {(activeTab === 'all' || activeTab === 'leaderboard') && (
          <TeamLeaderboard
            allCalls={allCalls}
            onSelectRepCall={(call) => {
              handleSelectCall(call);
              setActiveTab('coaching');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onViewRepTrends={(repName) => {
              setTrendsTargetRep(repName);
              setActiveTab('all');
              setTimeout(() => {
                const el = document.getElementById('performance-trends');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
          />
        )}

        {/* 10-Call Performance Trends Widget (Recharts) */}
        {(activeTab === 'all' || activeTab === 'coaching') && (
          <PerformanceTrendsWidget currentRepName={trendsTargetRep} />
        )}

        {/* Diarized Transcript (Speaker A vs Speaker B) */}
        {(activeTab === 'all' || activeTab === 'coaching') && (
          <DiarizedTranscript
            transcript={currentCall.transcript}
            currentTime={currentTime}
            onSeek={handleSeek}
            repName={currentCall.repName}
            prospectName={currentCall.prospectContact}
            talkListenRatio={currentCall.scorecard.talkListenRatio}
            onRenameSpeaker={handleRenameSpeaker}
          />
        )}
      </main>

      {/* Floating Sticky Audio Player */}
      <AudioPlayerBar
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        playbackRate={playbackRate}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onRateChange={setPlaybackRate}
        currentSpeaker={currentSegment ? currentSegment.speakerName || currentSegment.speaker : currentCall.callTitle}
        currentSpeakerRole={currentSegment?.speakerRole}
        currentSentiment={currentSegment?.sentiment}
      />

      {/* Side-by-Side Call Comparison Modal */}
      <CallComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        availableCalls={allCalls}
        initialCallAId={currentCall.id}
        onSelectCallToView={(call) => handleSelectCall(call)}
      />

      {/* Call Highlights & Action Items Checklist Sidebar */}
      <CallHighlightsSidebar
        isOpen={isHighlightsOpen}
        onToggle={() => setIsHighlightsOpen(!isHighlightsOpen)}
        call={currentCall}
        onSeek={handleSeek}
      />

      {/* Upload & Record Modal */}
      <UploadAndRecordModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAnalysisComplete={(analyzedCall) => {
          setAllCalls((prev) => [analyzedCall, ...prev]);
          setCurrentCall(analyzedCall);
          setCurrentTime(0);
          setIsPlaying(false);
        }}
      />

      {/* Follow Up Email Modal */}
      {currentCall.suggestedFollowUpEmail && (
        <FollowUpEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          email={currentCall.suggestedFollowUpEmail}
          prospectContact={currentCall.prospectContact}
          repName={currentCall.repName}
        />
      )}

      {/* Objection Battlecard Modal */}
      {currentCall.keyObjections && (
        <ObjectionBattlecardModal
          isOpen={isObjectionModalOpen}
          onClose={() => setIsObjectionModalOpen(false)}
          objections={currentCall.keyObjections}
          onSeek={handleSeek}
        />
      )}

      {/* Interactive AI Roleplay Modal */}
      <RoleplayModal
        isOpen={Boolean(roleplayItem)}
        onClose={() => setRoleplayItem(null)}
        coachingItem={roleplayItem}
        methodology={currentCall.methodologyFramework || 'MEDDPICC'}
      />
    </div>
  );
}

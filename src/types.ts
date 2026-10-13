export interface TranscriptSegment {
  id: string;
  speaker: 'Speaker A' | 'Speaker B';
  speakerRole: 'Sales Rep' | 'Prospect';
  speakerName?: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  timestamp: string; // e.g. "00:15 - 00:28"
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'excited' | 'hesitant';
  sentimentScore: number; // -1.0 to 1.0
  tags?: string[]; // e.g. ["Pricing", "Discovery", "Objection", "Next Steps"]
  tone?: 'Assertive' | 'Empathetic' | 'Hesitant';
}

export interface SentimentTimePoint {
  timeSeconds: number;
  timestamp: string; // e.g. "01:30"
  repScore: number; // -1.0 to 1.0 (or 0 to 100)
  prospectScore: number; // -1.0 to 1.0
  overallEngagement: number; // 0 to 100
  keyEvent?: string; // e.g. "Pricing sticker shock"
  sentimentCategory: 'positive' | 'neutral' | 'negative' | 'critical_moment';
  summarySnippet?: string;
}

export interface CoachingItem {
  id: string;
  title: string;
  timestamp: string;
  timestampSeconds: number;
  category: 'Discovery' | 'Objection Handling' | 'Pacing' | 'Value Proposition' | 'Closing' | 'Active Listening' | 'Rapport';
  quote: string;
  whyItMatters: string;
  actionableFeedback: string;
  recommendedScript?: string;
}

export interface CallScorecard {
  overallScore: number; // 0-100
  talkListenRatio: {
    repPercent: number;
    prospectPercent: number;
  };
  longestMonologueSeconds: number;
  questionsAskedRep: number;
  objectionsRaised: number;
  objectionsHandledWell: number;
  dealHealth: 'High Probability' | 'Moderate Risk' | 'Needs Nurturing' | 'Stalled';
  dealHealthScore: number; // 0-100
  callDurationSeconds: number;
}

export interface SalesAnalysisResult {
  id: string;
  callTitle: string;
  prospectCompany: string;
  prospectContact: string;
  repName: string;
  callDate: string;
  durationFormatted: string;
  durationSeconds: number;
  executiveSummary: string;
  methodologyFramework?: 'MEDDPICC' | 'SPIN' | 'Challenger' | 'Sandler';
  frameworkNotes?: string;
  scorecard: CallScorecard;
  transcript: TranscriptSegment[];
  sentimentTimeline: SentimentTimePoint[];
  coachingCard: {
    strengths: CoachingItem[]; // exactly 3 items
    missedOpportunities: CoachingItem[]; // exactly 3 items
  };
  keyObjections: Array<{
    timestamp: string;
    objection: string;
    repResponse: string;
    rating: 'Mastered' | 'Acceptable' | 'Needs Work';
    betterApproach: string;
  }>;
  suggestedFollowUpEmail: {
    subject: string;
    body: string;
  };
  actionItems?: ActionItem[];
  decisionMilestones?: DecisionMilestone[];
}

export interface ActionItem {
  id: string;
  title: string;
  assignee: 'Sales Rep' | 'Prospect' | 'Technical Team';
  assigneeName?: string;
  dueDate?: string;
  timestamp: string;
  timestampSeconds: number;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
  sourceQuote: string;
}

export interface DecisionMilestone {
  id: string;
  milestone: string;
  stage: 'Discovery' | 'Technical Validation' | 'Security / InfoSec' | 'Commercials / Legal' | 'Executive Signoff';
  status: 'Achieved' | 'In Progress' | 'Blocked';
  timestamp: string;
  timestampSeconds: number;
  evidence: string;
  nextStepRequirement: string;
}


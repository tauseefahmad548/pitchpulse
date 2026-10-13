export interface RepCallTrendPoint {
  callNumber: number;
  callId: string;
  date: string;
  company: string;
  overallScore: number;
  objectionScore: number;
  discoveryScore: number;
  talkPercent: number;
  longestMonologue: number;
  coachingMilestone?: string;
  notes?: string;
}

export interface RepTrendProfile {
  repName: string;
  role: string;
  avatarInitials: string;
  history: RepCallTrendPoint[];
  summary: {
    startingScore: number;
    currentScore: number;
    scoreDelta: number;
    trendStatus: 'Rapid Improvement' | 'Consistent Growth' | 'Plateaued' | 'Top Performer';
    fastestGrowingSkill: string;
    nextCoachingGoal: string;
    avgScoreLast10: number;
  };
}

export const REP_TRENDS: Record<string, RepTrendProfile> = {
  'Sarah Jenkins (Senior AE)': {
    repName: 'Sarah Jenkins',
    role: 'Senior Enterprise AE',
    avatarInitials: 'SJ',
    summary: {
      startingScore: 68,
      currentScore: 92,
      scoreDelta: 24,
      trendStatus: 'Consistent Growth',
      fastestGrowingSkill: 'Active Discovery & Impact Probing (+28 pts)',
      nextCoachingGoal: 'Eliminate unprompted discounting during commercial discussions',
      avgScoreLast10: 81.4,
    },
    history: [
      {
        callNumber: 1,
        callId: 'sj-call-1',
        date: 'Sep 12',
        company: 'Vanguard Retail',
        overallScore: 68,
        objectionScore: 60,
        discoveryScore: 64,
        talkPercent: 58,
        longestMonologue: 72,
        coachingMilestone: 'Baseline call: Over-pitched product features',
      },
      {
        callNumber: 2,
        callId: 'sj-call-2',
        date: 'Sep 16',
        company: 'Starlight Media',
        overallScore: 71,
        objectionScore: 65,
        discoveryScore: 68,
        talkPercent: 54,
        longestMonologue: 65,
        coachingMilestone: 'Started implementing open-ended inquiry questions',
      },
      {
        callNumber: 3,
        callId: 'sj-call-3',
        date: 'Sep 21',
        company: 'Meridian Health',
        overallScore: 73,
        objectionScore: 70,
        discoveryScore: 72,
        talkPercent: 50,
        longestMonologue: 58,
        coachingMilestone: 'Reduced talk ratio from 58% to 50%',
      },
      {
        callNumber: 4,
        callId: 'sj-call-4',
        date: 'Sep 25',
        company: 'Zenith Logistics',
        overallScore: 76,
        objectionScore: 72,
        discoveryScore: 75,
        talkPercent: 48,
        longestMonologue: 52,
        coachingMilestone: 'First successful second-order pain qualification',
      },
      {
        callNumber: 5,
        callId: 'sj-call-5',
        date: 'Sep 29',
        company: 'Pacific Heights Fin',
        overallScore: 79,
        objectionScore: 76,
        discoveryScore: 80,
        talkPercent: 46,
        longestMonologue: 50,
        coachingMilestone: 'Defused procurement pushback with ROI math',
      },
      {
        callNumber: 6,
        callId: 'sj-call-6',
        date: 'Oct 02',
        company: 'AeroDynamics Lab',
        overallScore: 81,
        objectionScore: 80,
        discoveryScore: 82,
        talkPercent: 45,
        longestMonologue: 48,
        coachingMilestone: 'Pacing breakthrough: Monologues kept under 50s',
      },
      {
        callNumber: 7,
        callId: 'sj-call-7',
        date: 'Oct 05',
        company: 'Nexus Financial Systems',
        overallScore: 84,
        objectionScore: 82,
        discoveryScore: 88,
        talkPercent: 42,
        longestMonologue: 48,
        coachingMilestone: 'Barclays reference defusal & FINRA downstream drilldown',
      },
      {
        callNumber: 8,
        callId: 'sj-call-8',
        date: 'Oct 08',
        company: 'Krypton Cyber Corp',
        overallScore: 86,
        objectionScore: 85,
        discoveryScore: 89,
        talkPercent: 41,
        longestMonologue: 44,
        coachingMilestone: 'Secured joint architectural scope meeting on live call',
      },
      {
        callNumber: 9,
        callId: 'sj-call-9',
        date: 'Oct 11',
        company: 'Horizon Cloud Corp',
        overallScore: 88,
        objectionScore: 88,
        discoveryScore: 91,
        talkPercent: 40,
        longestMonologue: 42,
        coachingMilestone: 'Zero feature dumping; 100% consultative diagnosis',
      },
      {
        callNumber: 10,
        callId: 'sj-call-10',
        date: 'Today',
        company: 'Atlas Global Systems',
        overallScore: 92,
        objectionScore: 92,
        discoveryScore: 94,
        talkPercent: 38,
        longestMonologue: 36,
        coachingMilestone: 'Flawless MEDDPICC metrics & executive buyer commitment',
      },
    ],
  },
  'David Chen (Account Executive)': {
    repName: 'David Chen',
    role: 'Commercial Account Executive',
    avatarInitials: 'DC',
    summary: {
      startingScore: 56,
      currentScore: 78,
      scoreDelta: 22,
      trendStatus: 'Rapid Improvement',
      fastestGrowingSkill: 'Monologue Trimming & Pausing (+24 pts)',
      nextCoachingGoal: 'Stop interrupting prospects when describing operational pain',
      avgScoreLast10: 67.2,
    },
    history: [
      { callNumber: 1, callId: 'dc-1', date: 'Sep 10', company: 'Prime Freight', overallScore: 56, objectionScore: 45, discoveryScore: 52, talkPercent: 74, longestMonologue: 95, coachingMilestone: 'Monologue alert: 95s speech fatigue' },
      { callNumber: 2, callId: 'dc-2', date: 'Sep 14', company: 'Titan Supply', overallScore: 59, objectionScore: 50, discoveryScore: 55, talkPercent: 71, longestMonologue: 90, coachingMilestone: 'Started using the 2-minute check-in rule' },
      { callNumber: 3, callId: 'dc-3', date: 'Sep 18', company: 'CrossRoads Logistics', overallScore: 62, objectionScore: 54, discoveryScore: 60, talkPercent: 69, longestMonologue: 88, coachingMilestone: 'Improved question count from 4 to 7' },
      { callNumber: 4, callId: 'dc-4', date: 'Sep 22', company: 'Swift Rail', overallScore: 65, objectionScore: 58, discoveryScore: 62, talkPercent: 68, longestMonologue: 85, coachingMilestone: 'Adopted active listening pauses' },
      { callNumber: 5, callId: 'dc-5', date: 'Sep 27', company: 'Apex Growth Logistics', overallScore: 68, objectionScore: 62, discoveryScore: 65, talkPercent: 68, longestMonologue: 84, coachingMilestone: 'AI deduplication pitch defused carrier fear' },
      { callNumber: 6, callId: 'dc-6', date: 'Oct 01', company: 'OmniCarrier Group', overallScore: 70, objectionScore: 66, discoveryScore: 68, talkPercent: 62, longestMonologue: 74, coachingMilestone: 'Locked follow-up demo on call' },
      { callNumber: 7, callId: 'dc-7', date: 'Oct 04', company: 'Summit Cold Storage', overallScore: 72, objectionScore: 70, discoveryScore: 71, talkPercent: 58, longestMonologue: 68, coachingMilestone: 'First call under 60% talk ratio' },
      { callNumber: 8, callId: 'dc-8', date: 'Oct 07', company: 'Vector Line Haul', overallScore: 74, objectionScore: 72, discoveryScore: 74, talkPercent: 55, longestMonologue: 60, coachingMilestone: 'Monologues capped at 60s' },
      { callNumber: 9, callId: 'dc-9', date: 'Oct 10', company: 'Harbor Gate Ports', overallScore: 76, objectionScore: 75, discoveryScore: 76, talkPercent: 52, longestMonologue: 55, coachingMilestone: 'Solid objection handling with case proof' },
      { callNumber: 10, callId: 'dc-10', date: 'Yesterday', company: 'Beacon Distribution', overallScore: 78, objectionScore: 78, discoveryScore: 80, talkPercent: 49, longestMonologue: 48, coachingMilestone: 'Balanced 49:51 conversation' },
    ],
  },
  'Rachel Ross (Principal Enterprise AE)': {
    repName: 'Rachel Ross',
    role: 'Principal Enterprise AE',
    avatarInitials: 'RR',
    summary: {
      startingScore: 82,
      currentScore: 96,
      scoreDelta: 14,
      trendStatus: 'Top Performer',
      fastestGrowingSkill: 'Give-to-Get Commercial Structuring (+16 pts)',
      nextCoachingGoal: 'Accelerate same-day DocuSign execution while momentum is peak',
      avgScoreLast10: 90.8,
    },
    history: [
      { callNumber: 1, callId: 'rr-1', date: 'Sep 08', company: 'Borealis Cloud', overallScore: 82, objectionScore: 80, discoveryScore: 84, talkPercent: 44, longestMonologue: 48, coachingMilestone: 'Strong discovery & security vetting' },
      { callNumber: 2, callId: 'rr-2', date: 'Sep 13', company: 'Stratos Data', overallScore: 85, objectionScore: 82, discoveryScore: 86, talkPercent: 42, longestMonologue: 45, coachingMilestone: 'Procurement ceiling addressed gracefully' },
      { callNumber: 3, callId: 'rr-3', date: 'Sep 17', company: 'Alpha Scale Inc', overallScore: 87, objectionScore: 85, discoveryScore: 88, talkPercent: 40, longestMonologue: 42, coachingMilestone: 'C-suite alignment with CEO & CFO' },
      { callNumber: 4, callId: 'rr-4', date: 'Sep 22', company: 'Pinnacle Systems', overallScore: 89, objectionScore: 88, discoveryScore: 90, talkPercent: 39, longestMonologue: 40, coachingMilestone: 'Mastered Challenger tension' },
      { callNumber: 5, callId: 'rr-5', date: 'Sep 26', company: 'Echo Payments', overallScore: 91, objectionScore: 90, discoveryScore: 92, talkPercent: 38, longestMonologue: 38, coachingMilestone: 'Closed 2-year enterprise agreement' },
      { callNumber: 6, callId: 'rr-6', date: 'Sep 30', company: 'Axiom Network', overallScore: 92, objectionScore: 91, discoveryScore: 93, talkPercent: 37, longestMonologue: 36, coachingMilestone: 'Economic buyer threshold identified' },
      { callNumber: 7, callId: 'rr-7', date: 'Oct 03', company: 'CloudMetrics Global', overallScore: 94, objectionScore: 94, discoveryScore: 95, talkPercent: 36, longestMonologue: 34, coachingMilestone: 'Defended 25% discount demand with 3-year term' },
      { callNumber: 8, callId: 'rr-8', date: 'Oct 06', company: 'Vertex Core', overallScore: 94, objectionScore: 95, discoveryScore: 94, talkPercent: 35, longestMonologue: 34, coachingMilestone: 'Co-marketing keynote secured in contract' },
      { callNumber: 9, callId: 'rr-9', date: 'Oct 09', company: 'Quantum Stream', overallScore: 95, objectionScore: 96, discoveryScore: 96, talkPercent: 35, longestMonologue: 32, coachingMilestone: 'Rapid contract turnaround' },
      { callNumber: 10, callId: 'rr-10', date: 'Today', company: 'Hyperion Scale', overallScore: 96, objectionScore: 97, discoveryScore: 97, talkPercent: 34, longestMonologue: 30, coachingMilestone: 'Flawless Challenger deal execution' },
    ],
  },
};

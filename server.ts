import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Increase payload limit to support audio uploads up to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client instance with User-Agent header as required
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

/**
 * Endpoint: Transcribe audio using gemini-3.5-transcribe
 */
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 payload.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in environment secrets.',
      });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: audioBase64,
      },
    };

    const promptText = `Please transcribe this sales call audio accurately. 
Diarize the speakers into "Speaker A (Sales Rep)" and "Speaker B (Prospect)".
Provide timestamps [MM:SS] for each dialogue turn, and capture exact statements, hesitations, and objections.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: { parts: [audioPart, { text: promptText }] },
    });

    const transcription = response.text || '';
    return res.json({ transcription });
  } catch (err: any) {
    console.error('Transcription error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to transcribe audio with gemini-3.5-transcribe.',
    });
  }
});

/**
 * Endpoint: Comprehensive Sales Call Analysis & Coaching Card
 * Diarized transcript + Sentiment Graph points + Coaching Card (3 well, 3 missed)
 */
app.post('/api/analyze-sales-call', async (req, res) => {
  try {
    const { audioBase64, mimeType, transcriptText, callTitle, framework } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment.',
      });
    }

    const systemInstruction = `You are PitchPulse, an elite VP of Sales and Executive Sales Coach.
You analyze audio and transcripts of B2B sales calls to provide deep coaching intelligence.
The framework requested is: ${framework || 'MEDDPICC'}.

You MUST return a JSON object strictly following this structure:
{
  "callTitle": string,
  "prospectCompany": string,
  "prospectContact": string,
  "repName": string,
  "durationFormatted": string (e.g. "07:30"),
  "durationSeconds": number,
  "executiveSummary": string,
  "methodologyFramework": string,
  "frameworkNotes": string,
  "scorecard": {
    "overallScore": number (0-100),
    "talkListenRatio": {
      "repPercent": number,
      "prospectPercent": number
    },
    "longestMonologueSeconds": number,
    "questionsAskedRep": number,
    "objectionsRaised": number,
    "objectionsHandledWell": number,
    "dealHealth": "High Probability" | "Moderate Risk" | "Needs Nurturing" | "Stalled",
    "dealHealthScore": number,
    "callDurationSeconds": number
  },
  "transcript": [
    {
      "id": string,
      "speaker": "Speaker A" | "Speaker B",
      "speakerRole": "Sales Rep" | "Prospect",
      "speakerName": string,
      "startTime": number,
      "endTime": number,
      "timestamp": string (e.g. "00:15 - 00:32"),
      "text": string,
      "sentiment": "positive" | "neutral" | "negative" | "excited" | "hesitant",
      "sentimentScore": number (between -1.0 and 1.0),
      "tags": string[] (e.g. ["Discovery", "Pricing", "Objection", "Next Steps"]),
      "tone": "Assertive" | "Empathetic" | "Hesitant" (vocal posture for Sales Rep turns)
    }
  ],
  "sentimentTimeline": [
    {
      "timeSeconds": number,
      "timestamp": string (e.g. "01:30"),
      "repScore": number (-1.0 to 1.0),
      "prospectScore": number (-1.0 to 1.0),
      "overallEngagement": number (0 to 100),
      "keyEvent": string (optional, e.g. "Pricing sticker shock" or "Value buy-in"),
      "sentimentCategory": "positive" | "neutral" | "negative" | "critical_moment",
      "summarySnippet": string
    }
  ],
  "coachingCard": {
    "strengths": [
      // EXACTLY 3 ITEMS the salesperson did well
      {
        "id": string,
        "title": string,
        "category": "Discovery" | "Objection Handling" | "Pacing" | "Value Proposition" | "Closing" | "Active Listening" | "Rapport",
        "timestamp": string,
        "timestampSeconds": number,
        "quote": string,
        "whyItMatters": string,
        "actionableFeedback": string
      }
    ],
    "missedOpportunities": [
      // EXACTLY 3 MISSED OPPORTUNITIES
      {
        "id": string,
        "title": string,
        "category": "Discovery" | "Objection Handling" | "Pacing" | "Value Proposition" | "Closing" | "Active Listening" | "Rapport",
        "timestamp": string,
        "timestampSeconds": number,
        "quote": string,
        "whyItMatters": string,
        "actionableFeedback": string,
        "recommendedScript": string (the exact script/rephrase the salesperson should say instead)
      }
    ]
  },
  "keyObjections": [
    {
      "timestamp": string,
      "objection": string,
      "repResponse": string,
      "rating": "Mastered" | "Acceptable" | "Needs Work",
      "betterApproach": string
    }
  ],
  "suggestedFollowUpEmail": {
    "subject": string,
    "body": string
  },
  "actionItems": [
    {
      "id": string,
      "title": string,
      "assignee": "Sales Rep" | "Prospect" | "Technical Team",
      "dueDate": string,
      "timestamp": string,
      "timestampSeconds": number,
      "completed": boolean,
      "priority": "High" | "Medium" | "Low",
      "sourceQuote": string
    }
  ],
  "decisionMilestones": [
    {
      "id": string,
      "milestone": string,
      "stage": "Discovery" | "Technical Validation" | "Security / InfoSec" | "Commercials / Legal" | "Executive Signoff",
      "status": "Achieved" | "In Progress" | "Blocked",
      "timestamp": string,
      "timestampSeconds": number,
      "evidence": string,
      "nextStepRequirement": string
    }
  ]
}

CRITICAL RULES:
1. CoachingCard.strengths MUST contain EXACTLY 3 items.
2. CoachingCard.missedOpportunities MUST contain EXACTLY 3 items.
3. Every strength and missed opportunity must cite an actual or inferred timestamp from the conversation.
4. The sentimentTimeline should have 6 to 12 chronologically ordered points across the entire call showing shifts in prospect and rep engagement.
5. The transcript must clearly separate Speaker A (Sales Rep) and Speaker B (Prospect).`;

    let contentsPayload: any;

    if (audioBase64) {
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'audio/mp3',
              data: audioBase64,
            },
          },
          {
            text: `Analyze this audio recording of a sales call. Produce the diarized transcript, sentiment graph data points, and the 3x3 coaching card. Call title: ${callTitle || 'Sales Call'}.`,
          },
        ],
      };
    } else if (transcriptText) {
      contentsPayload = {
        parts: [
          {
            text: `Analyze this sales call transcript:\n\n${transcriptText}\n\nProduce the diarized transcript, sentiment graph timeline, and the 3x3 coaching card. Call title: ${callTitle || 'Sales Call'}.`,
          },
        ],
      };
    } else {
      return res.status(400).json({ error: 'Please provide either audioBase64 or transcriptText.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contentsPayload,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const rawText = response.text || '{}';
    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch (e) {
      // Clean possible markdown code fences if any
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      analysis = JSON.parse(cleaned);
    }

    // Ensure id is present
    if (!analysis.id) {
      analysis.id = `call-analysis-${Date.now()}`;
    }

    return res.json(analysis);
  } catch (err: any) {
    console.error('Call analysis error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to analyze sales call.',
    });
  }
});

/**
 * Endpoint: Custom coaching roleplay / script rewrite using gemini-3.5-flash
 */
app.post('/api/coaching-script', async (req, res) => {
  try {
    const { scenario, repQuote, objective, methodology } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured.' });
    }

    const prompt = `You are a world-class sales enablement trainer.
Scenario: ${scenario || 'General sales discovery'}
Original Rep Line: "${repQuote}"
Objective: ${objective || 'Handle objection & regain consultative control'}
Methodology: ${methodology || 'SPIN / Challenger'}

Provide:
1. "The Problem": Why the original phrasing damages deal momentum.
2. "3 Alternative Phrasings":
   - Option A: Consultative & Question-led
   - Option B: Value-Anchored Pattern Interrupt
   - Option C: Direct Executive Reframing
3. "Follow-up Question": An open-ended question to transition back to the prospect.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    return res.json({ coachingScript: response.text });
  } catch (err: any) {
    console.error('Coaching script error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate coaching script.' });
  }
});

/**
 * Endpoint: Evaluate real-time voice-to-text roleplay response against coaching goals
 */
app.post('/api/evaluate-roleplay-response', async (req, res) => {
  try {
    const {
      userSpeech,
      coachingTitle,
      category,
      whyItMatters,
      actionableFeedback,
      recommendedScript,
      methodology,
      durationSeconds,
    } = req.body;

    if (!userSpeech || !userSpeech.trim()) {
      return res.status(400).json({ error: 'User speech/response is required.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured.' });
    }

    const prompt = `You are an elite Sales Enablement VP and Executive Sales Coach at PitchPulse.
A sales representative just completed a live vocal roleplay response (captured via real-time microphone voice-to-text).
Evaluate their spoken phrasing against the specific coaching goal and sales methodology.

Coaching Goal & Context:
- Scenario: ${coachingTitle || 'Sales Call Interaction'}
- Category: ${category || 'Objection Handling'}
- Why it mattered in the call: ${whyItMatters || 'Concession without establishing value'}
- Prescribed Coaching Feedback: ${actionableFeedback || 'Anchor business value before committing to next steps'}
- Target Recommended Script: "${recommendedScript || 'N/A'}"
- Methodology: ${methodology || 'MEDDPICC / Challenger'}
- Spoken Duration: ${durationSeconds || 12} seconds

Sales Rep's Actual Spoken Phrasing:
"${userSpeech}"

Respond ONLY with a valid JSON object matching this structure:
{
  "score": number (integer between 0 and 100),
  "alignmentTier": "Exceptional" | "Strong" | "Developing" | "Needs Work",
  "summaryHeadline": string (a punchy 6-10 word evaluation headline),
  "detailedCritique": string (2-3 sentences analyzing tactical impact and consultative posture),
  "keyStrengths": string[] (1 to 3 bullet points highlighting what they nailed in phrasing),
  "improvementPoints": string[] (1 to 3 actionable suggestions to improve phrasing),
  "detectedPowerWords": string[] (array of high-impact commercial/consultative terms used, e.g. "business metrics", "ROI", "governance", "timeline", "criteria"),
  "fillerOrWeakPhrases": string[] (array of weak words, apologies, or unforced concessions detected, e.g. "just", "sorry", "discount", "maybe", "hopefully"),
  "criteriaChecklist": [
    {
      "criterion": "Value Anchoring & Business Impact",
      "status": "passed" | "partial" | "missed",
      "explanation": string
    },
    {
      "criterion": "Consultative Framing & Control",
      "status": "passed" | "partial" | "missed",
      "explanation": string
    },
    {
      "criterion": "High-Impact Transition or Qualifying Question",
      "status": "passed" | "partial" | "missed",
      "explanation": string
    }
  ],
  "elevatedPhrasing": string (an upgraded, top-1% phrasing version that builds on the rep's words)
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const raw = response.text || '{}';
    let evaluation;
    try {
      evaluation = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      evaluation = JSON.parse(cleaned);
    }

    return res.json({ evaluation });
  } catch (err: any) {
    console.error('Evaluate roleplay error:', err);
    return res.status(500).json({ error: err.message || 'Failed to evaluate roleplay response' });
  }
});

// Mock CRM In-Memory Store
let mockCrmConfig = {
  activeProvider: 'salesforce' as 'salesforce' | 'hubspot',
  connectionStatus: 'connected' as 'connected' | 'disconnected',
  providers: {
    salesforce: {
      name: 'Salesforce Sales Cloud',
      instanceUrl: 'https://na140.lightning.force.com',
      authType: 'OAuth 2.0 Web Server Flow',
      sandboxMode: false,
      connectedUser: 'sarah.jenkins@enterprise.com',
      organizationId: '00D5g000004XYZ1EAA',
      targetOpportunity: 'OPP-8921: Nexus Financial - Enterprise Modernization ($145k)',
      fieldMapping: {
        taskSubject: 'Subject',
        taskDueDate: 'ActivityDate',
        taskOwner: 'OwnerId',
        taskPriority: 'Priority',
        sourceQuote: 'Description',
      },
      autoSyncOnCallEnd: true,
      createFollowUpTask: true,
      syncMilestonesAsOpportunityStage: true,
    },
    hubspot: {
      name: 'HubSpot Sales Hub Enterprise',
      instanceUrl: 'https://app.hubspot.com/contacts/8291482',
      authType: 'Private App Token',
      sandboxMode: false,
      connectedUser: 'sarah.jenkins@enterprise.com',
      portalId: '8291482',
      targetDeal: 'DEAL-4102: Nexus Financial Systems - Q4 Modernization',
      fieldMapping: {
        taskSubject: 'hs_task_body',
        taskDueDate: 'hs_timestamp',
        taskOwner: 'hubspot_owner_id',
        taskPriority: 'hs_task_priority',
        sourceQuote: 'hs_task_subject',
      },
      autoSyncOnCallEnd: true,
      createFollowUpTask: true,
      syncMilestonesAsOpportunityStage: true,
    },
  },
  availableOpportunities: [
    { id: 'OPP-8921', name: 'Nexus Financial - Enterprise Modernization', amount: '$145,000', stage: 'Value Proposition' },
    { id: 'OPP-4102', name: 'Apex Growth Logistics - CRM Replacement', amount: '$68,000', stage: 'Proposal / Price Quote' },
    { id: 'OPP-7749', name: 'CloudMetrics Global - 3-Year Enterprise License', amount: '$320,000', stage: 'Negotiation / Review' },
  ],
  syncHistory: [
    {
      batchId: 'SYNC-SF-9104',
      provider: 'salesforce',
      syncedAt: 'Yesterday, 4:45 PM',
      opportunityName: 'Apex Growth Logistics - CRM Replacement',
      tasksCreated: 3,
      status: 'Success',
    },
  ],
};

/**
 * Endpoint: Get Mock CRM Configuration
 */
app.get('/api/crm/config', (_req, res) => {
  return res.json(mockCrmConfig);
});

/**
 * Endpoint: Update Mock CRM Configuration
 */
app.post('/api/crm/config', (req, res) => {
  const { activeProvider, sandboxMode, targetOpportunity, autoSyncOnCallEnd, fieldMapping } = req.body;
  if (activeProvider && (activeProvider === 'salesforce' || activeProvider === 'hubspot')) {
    mockCrmConfig.activeProvider = activeProvider;
  }
  const curr = mockCrmConfig.providers[mockCrmConfig.activeProvider];
  if (sandboxMode !== undefined) curr.sandboxMode = sandboxMode;
  if (targetOpportunity) {
    if ('targetOpportunity' in curr) {
      (curr as any).targetOpportunity = targetOpportunity;
    } else {
      (curr as any).targetDeal = targetOpportunity;
    }
  }
  if (autoSyncOnCallEnd !== undefined) curr.autoSyncOnCallEnd = autoSyncOnCallEnd;
  if (fieldMapping) curr.fieldMapping = { ...curr.fieldMapping, ...fieldMapping };

  return res.json({ success: true, config: mockCrmConfig });
});

/**
 * Endpoint: Execute CRM Sync for Call Highlights
 */
app.post('/api/crm/sync', async (req, res) => {
  try {
    const { provider, actionItems, decisionMilestones, callTitle, opportunityId } = req.body;
    const targetProvider = provider || mockCrmConfig.activeProvider || 'salesforce';
    const isSF = targetProvider === 'salesforce';

    // Simulate realistic API latency
    await new Promise((r) => setTimeout(r, 650));

    const timestampPrefix = Date.now().toString().slice(-5);
    const syncBatchId = `SYNC-${isSF ? 'SF' : 'HS'}-${Date.now().toString().slice(-4)}`;

    const createdRecords = (actionItems || []).map((item: any, idx: number) => {
      const recordId = isSF ? `00T5g00000${timestampPrefix}${idx}EAA` : `hs_eng_task_${timestampPrefix}_${idx}`;
      return {
        id: recordId,
        crmType: isSF ? 'Task (Salesforce)' : 'Engagement / Task (HubSpot)',
        subject: item.title,
        assignedTo: item.assigneeName || item.assignee,
        dueDate: item.dueDate || 'Immediate',
        priority: item.priority || 'High',
        status: item.completed ? 'Completed' : 'Not Started',
        sourceQuote: item.sourceQuote,
        callTimestamp: item.timestamp,
        crmUrl: isSF 
          ? `https://na140.lightning.force.com/lightning/r/Task/${recordId}/view`
          : `https://app.hubspot.com/contacts/8291482/task/${recordId}`,
      };
    });

    const syncedMilestones = (decisionMilestones || []).map((m: any, idx: number) => ({
      milestoneId: isSF ? `OppHist_${timestampPrefix}_${idx}` : `deal_stage_${timestampPrefix}_${idx}`,
      milestone: m.milestone,
      stage: m.stage,
      status: m.status,
      timestamp: m.timestamp,
    }));

    // Record into sync history
    const historyItem = {
      batchId: syncBatchId,
      provider: targetProvider,
      syncedAt: 'Just now',
      opportunityName: callTitle || 'Nexus Financial Systems - Enterprise Modernization',
      tasksCreated: createdRecords.length,
      status: 'Success',
    };
    mockCrmConfig.syncHistory.unshift(historyItem);

    return res.json({
      success: true,
      batchId: syncBatchId,
      provider: targetProvider,
      providerName: isSF ? 'Salesforce Sales Cloud' : 'HubSpot CRM',
      opportunityId: opportunityId || 'OPP-8921',
      opportunityName: callTitle || 'Nexus Financial - Enterprise Modernization',
      syncedAt: new Date().toISOString(),
      createdRecordsCount: createdRecords.length,
      records: createdRecords,
      milestones: syncedMilestones,
      auditMessage: `Successfully created ${createdRecords.length} CRM Task objects and verified ${syncedMilestones.length} Deal Stage requirements in ${isSF ? 'Salesforce' : 'HubSpot'}.`,
    });
  } catch (err: any) {
    console.error('CRM sync error:', err);
    return res.status(500).json({ error: err.message || 'Failed to sync with CRM.' });
  }
});

// Vite middleware setup
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`PitchPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import { SalesAnalysisResult, TranscriptSegment } from '../types';

export interface ExtractedDealSignal {
  id: string;
  callId: string;
  callTitle: string;
  prospectCompany: string;
  prospectContact: string;
  repName: string;
  callDate: string;
  dealValue: number; // in USD
  dealValueFormatted: string; // e.g. "$45k" or "$150k"
  valueKeyword: string; // raw matched keyword, e.g. "$45k", "$150k", "$1.2M"
  timelineKeyword: string; // e.g. "next month", "Q4", "this Friday"
  timelineBucket: 'This Month' | 'Next Month' | 'Q4 (Current)' | 'Q1 (Next Quarter)' | 'H1 (Later)';
  dealHealthTier: 'High Probability' | 'Moderate Risk' | 'Needs Nurturing';
  dealHealthScore: number; // 0-100
  weightedValue: number; // dealValue * (dealHealthScore / 100)
  signalType: 'Contract / ACV' | 'Total Contract Value' | 'Expansion / Upsell' | 'Cost of Inaction Anchor';
  isPrimaryDeal: boolean; // True if represents company's purchase license rather than a downside risk anchor
  transcriptSnippet: string;
  timestamp: string;
  speakerRole: 'Sales Rep' | 'Prospect';
  speakerName: string;
}

export interface TimelineBucketData {
  bucket: string;
  label: string;
  projectedRevenue: number; // Gross unweighted
  weightedRevenue: number; // AI-weighted by deal health
  dealCount: number;
  dealSignals: ExtractedDealSignal[];
  primaryRep: string;
}

export interface RepPipelineData {
  repName: string;
  projectedRevenue: number;
  weightedRevenue: number;
  dealCount: number;
  avgHealthScore: number;
  dealSignals: ExtractedDealSignal[];
}

export interface HealthTierPipelineData {
  tier: 'High Probability' | 'Moderate Risk' | 'Needs Nurturing';
  projectedRevenue: number;
  weightedRevenue: number;
  dealCount: number;
  color: string;
}

export interface PipelineForecastSummary {
  totalPipelineRevenue: number;
  totalWeightedRevenue: number;
  averageDealSize: number;
  totalDealsIdentified: number;
  nextMonthRevenue: number;
  nextMonthWeighted: number;
  highProbabilityRevenue: number;
  avgWinRatePercentage: number;
  costOfInactionAnchored: number;
}

export interface PipelineForecastResult {
  deals: ExtractedDealSignal[];
  primaryDeals: ExtractedDealSignal[];
  timelineBuckets: TimelineBucketData[];
  repBuckets: RepPipelineData[];
  healthBuckets: HealthTierPipelineData[];
  summary: PipelineForecastSummary;
}

/**
 * Parses raw monetary text strings (e.g. "$10k", "$1.2M", "$45,000", "$150k") into numeric USD
 */
export function parseCurrencyAmount(rawStr: string): number {
  const clean = rawStr.replace(/[\$,]/g, '').trim().toLowerCase();
  
  if (clean.endsWith('m') || clean.endsWith('million')) {
    const val = parseFloat(clean.replace(/million|m/, ''));
    return isNaN(val) ? 0 : Math.round(val * 1000000);
  }
  if (clean.endsWith('k') || clean.endsWith('thousand')) {
    const val = parseFloat(clean.replace(/thousand|k/, ''));
    return isNaN(val) ? 0 : Math.round(val * 1000);
  }
  if (clean.endsWith('b') || clean.endsWith('billion')) {
    const val = parseFloat(clean.replace(/billion|b/, ''));
    return isNaN(val) ? 0 : Math.round(val * 1000000000);
  }
  
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : Math.round(val);
}

/**
 * Formats numeric USD amount into human readable "$45k", "$1.2M", etc.
 */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000) {
    const m = (amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1);
    return `$${m}M`;
  }
  if (amount >= 1000) {
    const k = (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 0);
    return `$${k}k`;
  }
  return `$${amount.toLocaleString()}`;
}

/**
 * Classifies a timeline string/snippet into forecast timeline periods
 */
export function classifyTimeline(text: string): {
  bucket: 'This Month' | 'Next Month' | 'Q4 (Current)' | 'Q1 (Next Quarter)' | 'H1 (Later)';
  keyword: string;
} {
  const lower = text.toLowerCase();
  
  if (lower.includes('next month')) {
    return { bucket: 'Next Month', keyword: 'next month' };
  }
  if (lower.includes('q1') || lower.includes('first quarter') || lower.includes('january') || lower.includes('36-month')) {
    return { bucket: 'Q1 (Next Quarter)', keyword: lower.includes('q1') ? 'Q1' : 'Next Quarter' };
  }
  if (lower.includes('q4') || lower.includes('fourth quarter') || lower.includes('november') || lower.includes('december') || lower.includes('year-end')) {
    return { bucket: 'Q4 (Current)', keyword: lower.includes('q4') ? 'Q4' : 'This Quarter' };
  }
  if (lower.includes('this week') || lower.includes('this friday') || lower.includes('today') || lower.includes('within 5 business days') || lower.includes('this month') || lower.includes('immediate')) {
    return { bucket: 'This Month', keyword: lower.includes('this friday') ? 'this Friday' : 'this month' };
  }
  if (lower.includes('within 30 days') || lower.includes('in 30 days') || lower.includes('in 45 days') || lower.includes('next 60 days')) {
    return { bucket: 'Next Month', keyword: 'in 30 days' };
  }
  if (lower.includes('h1') || lower.includes('next year') || lower.includes('long term')) {
    return { bucket: 'H1 (Later)', keyword: 'Next Year' };
  }
  
  // Default to Next Month as standard enterprise sales cycle
  return { bucket: 'Next Month', keyword: 'next month (inferred)' };
}

/**
 * Extracts deal values, timing signals, and projected revenue across all calls' transcripts
 */
export function extractPipelineForecast(
  calls: SalesAnalysisResult[],
  filterKeywords?: string[]
): PipelineForecastResult {
  const deals: ExtractedDealSignal[] = [];

  // Currency extraction regex: catches $10k, $45k, $1.2M, $150k, $250k, $3.4M, $50,000, etc.
  const moneyRegex = /\$([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+(?:\.[0-9]+)?)\s*(k|m|million|thousand|b|billion)?\b/gi;
  
  // Timeline indicators
  const timelineRegex = /(next\s+month|this\s+month|next\s+quarter|this\s+quarter|q1|q2|q3|q4|in\s+\d+\s+days|within\s+\d+\s+days|this\s+friday|end\s+of\s+(?:the\s+)?month|year-end|december|november|january)/gi;

  calls.forEach((call) => {
    const healthTier: 'High Probability' | 'Moderate Risk' | 'Needs Nurturing' = 
      call.scorecard.dealHealthScore >= 80 
        ? 'High Probability' 
        : call.scorecard.dealHealthScore >= 60 
          ? 'Moderate Risk' 
          : 'Needs Nurturing';
    
    const healthScore = call.scorecard.dealHealthScore || 75;

    // Scan each transcript segment
    call.transcript.forEach((segment: TranscriptSegment) => {
      const text = segment.text;
      const matches = Array.from(text.matchAll(moneyRegex));

      if (matches.length > 0) {
        matches.forEach((match, idx) => {
          const rawMatch = match[0];
          const parsedAmount = parseCurrencyAmount(rawMatch);
          
          if (parsedAmount < 1000) {
            // Ignore minor numbers under $1k
            return;
          }

          // Check for timing signals in the same turn or surrounding turns
          const timeMatch = text.match(timelineRegex);
          let timelineInfo = classifyTimeline(timeMatch ? timeMatch[0] : text);
          
          // Also look at executive summary or call title if segment has no explicit timeline
          if (timelineInfo.keyword.includes('(inferred)')) {
            const fallbackTime = classifyTimeline(call.executiveSummary + ' ' + (call.frameworkNotes || ''));
            if (!fallbackTime.keyword.includes('(inferred)')) {
              timelineInfo = fallbackTime;
            }
          }

          // Determine signal type and primary flag
          const lowerText = text.toLowerCase();
          let signalType: ExtractedDealSignal['signalType'] = 'Contract / ACV';
          let isPrimaryDeal = true;

          if (lowerText.includes('latency') || lowerText.includes('penalty') || lowerText.includes('downtime') || lowerText.includes('outage') || lowerText.includes('fine') || lowerText.includes('risk') || lowerText.includes('cost of')) {
            signalType = 'Cost of Inaction Anchor';
            isPrimaryDeal = false; // Downside anchor, not gross software contract
          } else if (lowerText.includes('36-month') || lowerText.includes('3-year') || lowerText.includes('multi-year') || lowerText.includes('total contract')) {
            signalType = 'Total Contract Value';
            isPrimaryDeal = true;
          } else if (lowerText.includes('onboarding') || lowerText.includes('pilot') || lowerText.includes('trial') || lowerText.includes('sandbox')) {
            signalType = 'Expansion / Upsell';
            isPrimaryDeal = true;
          } else {
            signalType = 'Contract / ACV';
            isPrimaryDeal = true;
          }

          // If custom filter keywords provided, check match
          if (filterKeywords && filterKeywords.length > 0) {
            const matchesAny = filterKeywords.some((kw) => 
              text.toLowerCase().includes(kw.toLowerCase()) || 
              rawMatch.toLowerCase().includes(kw.toLowerCase()) ||
              timelineInfo.keyword.toLowerCase().includes(kw.toLowerCase())
            );
            if (!matchesAny) return;
          }

          deals.push({
            id: `deal-${call.id}-${segment.id}-${idx}`,
            callId: call.id,
            callTitle: call.callTitle,
            prospectCompany: call.prospectCompany,
            prospectContact: call.prospectContact,
            repName: call.repName,
            callDate: call.callDate,
            dealValue: parsedAmount,
            dealValueFormatted: formatCurrencyShort(parsedAmount),
            valueKeyword: rawMatch,
            timelineKeyword: timelineInfo.keyword,
            timelineBucket: timelineInfo.bucket,
            dealHealthTier: healthTier,
            dealHealthScore: healthScore,
            weightedValue: Math.round(parsedAmount * (healthScore / 100)),
            signalType,
            isPrimaryDeal,
            transcriptSnippet: text,
            timestamp: segment.timestamp,
            speakerRole: segment.speakerRole,
            speakerName: segment.speakerName || segment.speaker,
          });
        });
      }
    });

    // If a call didn't have explicit currency in transcript text directly,
    // check its framework notes, executive summary, or action items (e.g. $1.2M or $50k)
    const callHasDeals = deals.some((d) => d.callId === call.id);
    if (!callHasDeals) {
      const summaryText = `${call.executiveSummary} ${call.frameworkNotes || ''}`;
      const summaryMatches = Array.from(summaryText.matchAll(moneyRegex));
      
      summaryMatches.forEach((match, idx) => {
        const rawMatch = match[0];
        const parsedAmount = parseCurrencyAmount(rawMatch);
        if (parsedAmount >= 5000) {
          const timelineInfo = classifyTimeline(summaryText);
          const isAnchor = summaryText.toLowerCase().includes('latency') || summaryText.toLowerCase().includes('downtime') || summaryText.toLowerCase().includes('penalty');
          
          deals.push({
            id: `deal-${call.id}-summary-${idx}`,
            callId: call.id,
            callTitle: call.callTitle,
            prospectCompany: call.prospectCompany,
            prospectContact: call.prospectContact,
            repName: call.repName,
            callDate: call.callDate,
            dealValue: parsedAmount,
            dealValueFormatted: formatCurrencyShort(parsedAmount),
            valueKeyword: rawMatch,
            timelineKeyword: timelineInfo.keyword,
            timelineBucket: timelineInfo.bucket,
            dealHealthTier: healthTier,
            dealHealthScore: healthScore,
            weightedValue: Math.round(parsedAmount * (healthScore / 100)),
            signalType: isAnchor ? 'Cost of Inaction Anchor' : 'Contract / ACV',
            isPrimaryDeal: !isAnchor,
            transcriptSnippet: call.executiveSummary,
            timestamp: '00:00',
            speakerRole: 'Sales Rep',
            speakerName: call.repName,
          });
        }
      });
    }
  });

  // Extract primary deals (Software ACV / TCV licenses) vs cost-of-inaction anchors
  const primaryDeals = deals.filter((d) => d.isPrimaryDeal);
  const anchorDeals = deals.filter((d) => !d.isPrimaryDeal);

  // Group by timeline buckets for the bar chart
  const bucketOrder: Array<ExtractedDealSignal['timelineBucket']> = [
    'This Month',
    'Next Month',
    'Q4 (Current)',
    'Q1 (Next Quarter)',
    'H1 (Later)',
  ];

  const timelineBuckets: TimelineBucketData[] = bucketOrder.map((bucketName) => {
    const bucketDeals = primaryDeals.filter((d) => d.timelineBucket === bucketName);
    const grossRev = bucketDeals.reduce((sum, d) => sum + d.dealValue, 0);
    const weightedRev = bucketDeals.reduce((sum, d) => sum + d.weightedValue, 0);
    const primaryRep = bucketDeals.length > 0 ? bucketDeals[0].repName.split(' ')[0] : 'Open';

    return {
      bucket: bucketName,
      label: bucketName,
      projectedRevenue: grossRev,
      weightedRevenue: weightedRev,
      dealCount: bucketDeals.length,
      dealSignals: bucketDeals,
      primaryRep,
    };
  });

  // Group by sales reps
  const repMap = new Map<string, ExtractedDealSignal[]>();
  primaryDeals.forEach((d) => {
    const rep = d.repName;
    if (!repMap.has(rep)) {
      repMap.set(rep, []);
    }
    repMap.get(rep)!.push(d);
  });

  const repBuckets: RepPipelineData[] = Array.from(repMap.entries()).map(([repName, repDeals]) => {
    const gross = repDeals.reduce((sum, d) => sum + d.dealValue, 0);
    const weighted = repDeals.reduce((sum, d) => sum + d.weightedValue, 0);
    const avgHealth = Math.round(repDeals.reduce((sum, d) => sum + d.dealHealthScore, 0) / repDeals.length);

    return {
      repName,
      projectedRevenue: gross,
      weightedRevenue: weighted,
      dealCount: repDeals.length,
      avgHealthScore: avgHealth,
      dealSignals: repDeals,
    };
  }).sort((a, b) => b.weightedRevenue - a.weightedRevenue);

  // Group by health tiers
  const tierOrder: Array<ExtractedDealSignal['dealHealthTier']> = [
    'High Probability',
    'Moderate Risk',
    'Needs Nurturing',
  ];

  const healthBuckets: HealthTierPipelineData[] = tierOrder.map((tier) => {
    const tierDeals = primaryDeals.filter((d) => d.dealHealthTier === tier);
    const gross = tierDeals.reduce((sum, d) => sum + d.dealValue, 0);
    const weighted = tierDeals.reduce((sum, d) => sum + d.weightedValue, 0);
    const color = tier === 'High Probability' ? '#10b981' : tier === 'Moderate Risk' ? '#f59e0b' : '#ef4444';

    return {
      tier,
      projectedRevenue: gross,
      weightedRevenue: weighted,
      dealCount: tierDeals.length,
      color,
    };
  });

  // Summary statistics
  const totalPipelineRevenue = primaryDeals.reduce((sum, d) => sum + d.dealValue, 0);
  const totalWeightedRevenue = primaryDeals.reduce((sum, d) => sum + d.weightedValue, 0);
  const averageDealSize = primaryDeals.length > 0 ? Math.round(totalPipelineRevenue / primaryDeals.length) : 0;
  
  const nextMonthDeals = primaryDeals.filter((d) => d.timelineBucket === 'Next Month');
  const nextMonthRevenue = nextMonthDeals.reduce((sum, d) => sum + d.dealValue, 0);
  const nextMonthWeighted = nextMonthDeals.reduce((sum, d) => sum + d.weightedValue, 0);

  const highProbDeals = primaryDeals.filter((d) => d.dealHealthTier === 'High Probability');
  const highProbabilityRevenue = highProbDeals.reduce((sum, d) => sum + d.dealValue, 0);

  const avgWinRatePercentage = totalPipelineRevenue > 0 ? Math.round((totalWeightedRevenue / totalPipelineRevenue) * 100) : 0;
  const costOfInactionAnchored = anchorDeals.reduce((sum, d) => sum + d.dealValue, 0);

  return {
    deals,
    primaryDeals,
    timelineBuckets,
    repBuckets,
    healthBuckets,
    summary: {
      totalPipelineRevenue,
      totalWeightedRevenue,
      averageDealSize,
      totalDealsIdentified: primaryDeals.length,
      nextMonthRevenue,
      nextMonthWeighted,
      highProbabilityRevenue,
      avgWinRatePercentage,
      costOfInactionAnchored,
    },
  };
}

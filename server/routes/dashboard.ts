import { Router } from 'express';
import type { Request, Response } from 'express';
import { scanSessionFiles } from '../lib/directory-scanner.js';
import { aggregateSession } from '../lib/session-aggregator.js';
import type { DashboardData, TokenUsage, SessionSummary } from '../lib/types.js';

const router = Router();

let dashboardCache: DashboardData | null = null;

export function clearDashboardCache() {
  dashboardCache = null;
}

/**
 * GET /api/dashboard
 * Returns aggregated dashboard data: totals, tokensByModel, dailyTokens, topSessions.
 */
router.get('/api/dashboard', async (_req: Request, res: Response) => {
  try {
    if (!dashboardCache) {
      dashboardCache = await buildDashboardData();
    }
    res.json(dashboardCache);
  } catch (error) {
    console.error('Error building dashboard:', error);
    res.status(500).json({ error: 'Failed to build dashboard data' });
  }
});

async function buildDashboardData(): Promise<DashboardData> {
  const files = await scanSessionFiles();

  let totalSessions = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCacheCreationTokens = 0;
  let totalRequests = 0;

  const tokensByModel: Record<string, TokenUsage> = {};
  const dailyMap = new Map<
    string,
    { input: number; output: number; cacheRead: number; cacheCreation: number }
  >();
  const allSummaries: SessionSummary[] = [];

  for (const file of files) {
    const result = await aggregateSession(file);
    if (!result) continue;

    totalSessions++;
    allSummaries.push(result.summary);

    totalInputTokens += result.summary.totalInputTokens;
    totalOutputTokens += result.summary.totalOutputTokens;
    totalCacheReadTokens += result.summary.totalCacheReadTokens;
    totalCacheCreationTokens += result.summary.totalCacheCreationTokens;
    totalRequests += result.summary.requestCount;

    // Aggregate by model
    for (const req of result.detail.requests) {
      if (!tokensByModel[req.model]) {
        tokensByModel[req.model] = {
          input_tokens: 0,
          output_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        };
      }
      const modelUsage = tokensByModel[req.model];
      if (modelUsage) {
        modelUsage.input_tokens += req.inputTokens;
        modelUsage.output_tokens += req.outputTokens;
        modelUsage.cache_read_input_tokens += req.cacheReadTokens;
        modelUsage.cache_creation_input_tokens += req.cacheCreationTokens;
      }
    }

    // Aggregate by day
    for (const req of result.detail.requests) {
      if (!req.timestamp) continue;
      const date = req.timestamp.slice(0, 10); // "YYYY-MM-DD"
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 });
      }
      const day = dailyMap.get(date);
      if (day) {
        day.input += req.inputTokens;
        day.output += req.outputTokens;
        day.cacheRead += req.cacheReadTokens;
        day.cacheCreation += req.cacheCreationTokens;
      }
    }
  }

  // Convert daily map to sorted array
  const dailyTokens = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top 10 sessions by total tokens
  const topSessions = allSummaries
    .sort(
      (a, b) =>
        b.totalInputTokens +
        b.totalOutputTokens -
        (a.totalInputTokens + a.totalOutputTokens)
    )
    .slice(0, 10);

  return {
    totalSessions,
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalCacheCreationTokens,
    totalRequests,
    tokensByModel,
    dailyTokens,
    topSessions,
  };
}

export default router;

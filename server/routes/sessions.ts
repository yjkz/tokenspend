import { Router } from 'express';
import type { Request, Response } from 'express';
import { scanSessionFiles } from '../lib/directory-scanner.js';
import { aggregateSession } from '../lib/session-aggregator.js';
import { parseJsonlFile } from '../lib/jsonl-parser.js';
import { extractRounds } from '../lib/round-extractor.js';

const router = Router();

// In-memory cache: sessionId -> SessionDetail
let sessionsCache: import('../lib/types.js').SessionSummary[] | null = null;
let detailsCache = new Map<string, import('../lib/types.js').SessionDetail>();

export function clearSessionCache() {
  sessionsCache = null;
  detailsCache.clear();
}

/**
 * GET /api/sessions?project=
 * List all sessions, optionally filtered by project directory name.
 * Sorted by lastTimestamp descending.
 */
router.get('/api/sessions', async (req: Request, res: Response) => {
  try {
    if (!sessionsCache) {
      const files = await scanSessionFiles();
      const sums: import('../lib/types.js').SessionSummary[] = [];
      const dets = new Map<string, import('../lib/types.js').SessionDetail>();

      for (const f of files) {
        const result = await aggregateSession(f);
        if (result) {
          sums.push(result.summary);
          dets.set(result.summary.sessionId, result.detail);
        }
      }

      sums.sort((a, b) => b.lastTimestamp.localeCompare(a.lastTimestamp));
      sessionsCache = sums;
      detailsCache = dets;
    }

    let results = sessionsCache || [];

    // Filter by project if query param provided
    const projectFilter = req.query.project;
    const projectFilterStr = typeof projectFilter === 'string' ? projectFilter : undefined;
    if (projectFilterStr) {
      results = results.filter(
        (s) =>
          s.projectDir === projectFilterStr ||
          s.projectPath.toLowerCase().includes(projectFilterStr.toLowerCase())
      );
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * GET /api/sessions/:id
 * Get full session detail with per-request breakdown.
 */
router.get('/api/sessions/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Check cache first
    if (detailsCache.has(id)) {
      res.json(detailsCache.get(id));
      return;
    }

    // If cache is cold, rebuild it
    if (!sessionsCache) {
      const files = await scanSessionFiles();
      for (const f of files) {
        const result = await aggregateSession(f);
        if (result) {
          detailsCache.set(result.summary.sessionId, result.detail);
        }
      }
    }

    const detail = detailsCache.get(id);
    if (!detail) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json(detail);
  } catch (error) {
    console.error('Error fetching session detail:', error);
    res.status(500).json({ error: 'Failed to fetch session detail' });
  }
});

/**
 * GET /api/sessions/:id/rounds
 * Get conversation rounds for a session.
 */
router.get('/api/sessions/:id/rounds', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Find the session file
    const files = await scanSessionFiles();
    const file = files.find(f => f.sessionId === id);
    if (!file) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const records = await parseJsonlFile(file.filePath);
    const rounds = extractRounds(records);
    res.json(rounds);
  } catch (error) {
    console.error('Error extracting rounds:', error);
    res.status(500).json({ error: 'Failed to extract rounds' });
  }
});

export default router;

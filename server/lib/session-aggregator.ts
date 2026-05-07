import type { SessionSummary, SessionDetail, RequestEntry, TokenUsage } from './types.js';
import type { SessionFile } from './directory-scanner.js';
import { parseJsonlFile } from './jsonl-parser.js';
import { extractTokenUsage } from './token-extractor.js';

export interface AggregatedSession {
  summary: SessionSummary;
  detail: SessionDetail;
}

/**
 * Compute the primary model (most frequently used by request count).
 */
function computePrimaryModel(requests: RequestEntry[]): string {
  const counts = new Map<string, number>();
  for (const req of requests) {
    counts.set(req.model, (counts.get(req.model) || 0) + 1);
  }

  let bestModel = 'unknown';
  let bestCount = 0;
  for (const [model, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestModel = model;
    }
  }
  return bestModel;
}

/**
 * Aggregate a single session file into SessionSummary + SessionDetail.
 */
export async function aggregateSession(
  sessionFile: SessionFile
): Promise<AggregatedSession | null> {
  const { projectDir, sessionId, filePath, fileSize } = sessionFile;

  try {
    const records = await parseJsonlFile(filePath);
    const { requests, title } = extractTokenUsage(records);

    if (requests.length === 0) {
      return null;
    }

    // Sort by timestamp
    requests.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const timestamps = requests.map((r) => r.timestamp).filter(Boolean);
    const firstTimestamp = timestamps[0] || '';
    const lastTimestamp = timestamps[timestamps.length - 1] || '';

    const totalInputTokens = requests.reduce((sum, r) => sum + r.inputTokens, 0);
    const totalOutputTokens = requests.reduce((sum, r) => sum + r.outputTokens, 0);
    const totalCacheReadTokens = requests.reduce((sum, r) => sum + r.cacheReadTokens, 0);
    const totalCacheCreationTokens = requests.reduce(
      (sum, r) => sum + r.cacheCreationTokens,
      0
    );

    const model = computePrimaryModel(requests);

    // Decode project path from directory name
    const projectPath = decodeProjectDirSimple(projectDir);

    const summary: SessionSummary = {
      sessionId,
      projectDir,
      projectPath,
      title,
      firstTimestamp,
      lastTimestamp,
      totalInputTokens,
      totalOutputTokens,
      totalCacheReadTokens,
      totalCacheCreationTokens,
      requestCount: requests.length,
      model,
      fileSize,
    };

    const detail: SessionDetail = {
      ...summary,
      requests,
    };

    return { summary, detail };
  } catch {
    return null;
  }
}

/**
 * Simple project path decoder for use inside session aggregation.
 */
function decodeProjectDirSimple(dirName: string): string {
  if (dirName.length === 3 && dirName.endsWith('--')) {
    return dirName[0] + ':\\';
  }

  const parts = dirName.split('--');

  if (parts.length >= 2) {
    const drive = parts[0];
    const rest = parts.slice(1).join('\\');
    const decodedPath = drive + ':\\' + rest.replace(/-/g, '\\');
    return decodedPath.replace(/\\+$/, (match) => (match.length > 1 ? '\\' : ''));
  }

  return dirName.replace(/--/g, ':\\');
}

/**
 * Aggregate multiple sessions. Returns all summaries sorted by lastTimestamp descending.
 */
export async function aggregateAllSessions(
  sessionFiles: SessionFile[]
): Promise<{ summaries: SessionSummary[]; details: Map<string, SessionDetail> }> {
  const summaries: SessionSummary[] = [];
  const details = new Map<string, SessionDetail>();

  for (const sf of sessionFiles) {
    const result = await aggregateSession(sf);
    if (!result) continue;

    summaries.push(result.summary);
    details.set(result.summary.sessionId, result.detail);
  }

  // Sort by lastTimestamp descending (most recent first)
  summaries.sort((a, b) => b.lastTimestamp.localeCompare(a.lastTimestamp));

  return { summaries, details };
}

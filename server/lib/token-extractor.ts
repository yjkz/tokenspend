import type { RequestEntry, TokenUsage } from './types.js';
import type { RawRecord } from './jsonl-parser.js';

function hasTokens(usage: unknown): usage is TokenUsage {
  if (!usage || typeof usage !== 'object') return false;
  const u = usage as Record<string, unknown>;
  return (
    typeof u.input_tokens === 'number' ||
    typeof u.output_tokens === 'number' ||
    typeof u.cache_read_input_tokens === 'number' ||
    typeof u.cache_creation_input_tokens === 'number'
  );
}

function extractTokenCounts(usage: TokenUsage): {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
} {
  return {
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
    cacheReadTokens: usage.cache_read_input_tokens || 0,
    cacheCreationTokens: usage.cache_creation_input_tokens || 0,
  };
}

/**
 * Extract token usage records from parsed JSONL records.
 * Returns an array of RequestEntry objects.
 */
export function extractTokenUsage(records: RawRecord[]): {
  requests: RequestEntry[];
  title?: string;
} {
  const requests: RequestEntry[] = [];
  let title: string | undefined;

  for (const record of records) {
    const type = record.type as string;

    // Extract session title from ai-title records
    if (type === 'ai-title') {
      title = (record.title as string) || (record.aiTitle as string) || undefined;
      continue;
    }

    // Assistant records: extract from message.usage
    if (type === 'assistant') {
      const message = record.message as Record<string, unknown> | undefined;
      if (!message) continue;

      const usage = message.usage;
      if (!hasTokens(usage)) continue;

      const model = (message.model as string) || 'unknown';
      const tokenCounts = extractTokenCounts(usage as TokenUsage);

      // Skip records with zero tokens
      if (tokenCounts.inputTokens === 0 && tokenCounts.outputTokens === 0) continue;

      requests.push({
        timestamp: (record.timestamp as string) || '',
        model,
        ...tokenCounts,
        source: 'assistant',
      });
      continue;
    }

    // User records: extract from toolUseResult.usage
    if (type === 'user') {
      const toolUseResult = record.toolUseResult as Record<string, unknown> | undefined;
      if (!toolUseResult) continue;

      const usage = toolUseResult.usage;
      if (!hasTokens(usage)) continue;

      const model = (toolUseResult.model as string) || (record.model as string) || 'unknown';
      const agentType = (toolUseResult.agentType as string) || undefined;
      const tokenCounts = extractTokenCounts(usage as TokenUsage);

      // Skip records with zero tokens
      if (tokenCounts.inputTokens === 0 && tokenCounts.outputTokens === 0) continue;

      requests.push({
        timestamp: (record.timestamp as string) || '',
        model,
        ...tokenCounts,
        source: 'tool_result',
        agentType,
      });
    }
  }

  return { requests, title };
}

import * as fs from 'fs';
import * as readline from 'readline';

export interface RawRecord {
  [key: string]: unknown;
}

/**
 * Stream-parse a JSONL file and return all valid JSON records.
 * Skips malformed lines silently.
 */
export async function parseJsonlFile(filePath: string): Promise<RawRecord[]> {
  const records: RawRecord[] = [];
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const record = JSON.parse(trimmed) as RawRecord;
      records.push(record);
    } catch {
      // Skip malformed lines
    }
  }

  return records;
}

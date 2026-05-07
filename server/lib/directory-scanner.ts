import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface SessionFile {
  projectDir: string;
  sessionId: string;
  filePath: string;
  fileSize: number;
}

/**
 * Decode a project directory name back to a readable path.
 * The encoding pattern: colons and backslashes are replaced with `--`,
 * and backslashes between segments become `-`.
 *
 * Examples:
 *   "E--ClaudeGame" => "E:\\ClaudeGame"
 *   "E--ClaudeGame-tokenspend" => "E:\\ClaudeGame\\tokenspend"
 *   "F--" => "F:\\"
 *   "E--ClaudeGame--" => "E:\\ClaudeGame\\"
 */
export function decodeProjectDir(dirName: string): string {
  // Special case: "F--" => "F:\\"
  // The pattern is: drive letter + "--" means ":\"
  // Then remaining segments separated by "-" are subdirectories

  if (dirName.length === 3 && dirName.endsWith('--')) {
    // "F--" => "F:\\"
    return dirName[0] + ':\\';
  }

  // Try to decode "E--ClaudeGame-tokenspend" style names
  // Split on "--" first to get major segments
  const parts = dirName.split('--');

  if (parts.length >= 2) {
    // First part is drive letter, second part has the rest
    const drive = parts[0];
    const rest = parts.slice(1).join('\\'); // rejoin with backslash for any remaining --

    // Now within rest, single "-" separates path segments
    // But we need to be careful: single "-" in dir names could be ambiguous
    // The safest approach: replace single "-" with "\\"
    const decodedPath = drive + ':\\' + rest.replace(/-/g, '\\');

    // Remove trailing backslash unless it was explicit
    return decodedPath.replace(/\\+$/, (match) => match.length > 1 ? '\\' : '');
  }

  // Fallback: just replace "--" with ":\\"
  return dirName.replace(/--/g, ':\\');
}

/**
 * Scan ~/.claude/projects/ for all JSONL session files.
 * Skips subdirectories like subagents/ (matching UUID directories).
 */
export async function scanSessionFiles(): Promise<SessionFile[]> {
  const claudeDir = path.join(os.homedir(), '.claude', 'projects');

  if (!fs.existsSync(claudeDir)) {
    return [];
  }

  const results: SessionFile[] = [];
  const entries = fs.readdirSync(claudeDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const projectDir = entry.name;
    const projectPath = decodeProjectDir(projectDir);
    const projectAbsPath = path.join(claudeDir, projectDir);

    // Read directory contents - only JSONL files, skip subdirectories
    const files = fs.readdirSync(projectAbsPath, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile()) continue;
      if (!file.name.endsWith('.jsonl')) continue;

      const sessionId = file.name.replace('.jsonl', '');
      const filePath = path.join(projectAbsPath, file.name);
      const stat = fs.statSync(filePath);

      results.push({
        projectDir,
        sessionId,
        filePath,
        fileSize: stat.size,
      });
    }
  }

  return results;
}

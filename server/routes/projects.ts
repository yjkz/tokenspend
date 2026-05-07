import { Router } from 'express';
import type { Request, Response } from 'express';
import { scanSessionFiles, decodeProjectDir } from '../lib/directory-scanner.js';

const router = Router();

interface ProjectInfo {
  projectDir: string;
  projectPath: string;
  sessionCount: number;
  totalFileSize: number;
}

let projectsCache: ProjectInfo[] | null = null;

export function clearProjectsCache() {
  projectsCache = null;
}

/**
 * GET /api/projects
 * List all project directories with session counts.
 */
router.get('/api/projects', async (_req: Request, res: Response) => {
  try {
    if (!projectsCache) {
      const files = await scanSessionFiles();

      const projectMap = new Map<string, ProjectInfo>();

      for (const file of files) {
        const { projectDir, fileSize } = file;
        if (!projectMap.has(projectDir)) {
          projectMap.set(projectDir, {
            projectDir,
            projectPath: decodeProjectDir(projectDir),
            sessionCount: 0,
            totalFileSize: 0,
          });
        }
        const info = projectMap.get(projectDir)!;
        info.sessionCount++;
        info.totalFileSize += fileSize;
      }

      projectsCache = Array.from(projectMap.values()).sort(
        (a, b) => b.sessionCount - a.sessionCount
      );
    }

    res.json(projectsCache);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

export default router;

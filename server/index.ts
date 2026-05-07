import express from 'express';
import cors from 'cors';
import sessionsRouter from './routes/sessions.js';
import dashboardRouter from './routes/dashboard.js';
import projectsRouter from './routes/projects.js';
import { clearSessionCache } from './routes/sessions.js';
import { clearDashboardCache } from './routes/dashboard.js';
import { clearProjectsCache } from './routes/projects.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(sessionsRouter);
app.use(dashboardRouter);
app.use(projectsRouter);

/**
 * POST /api/refresh
 * Clear all caches and force a re-scan on next request.
 */
app.post('/api/refresh', (_req, res) => {
  clearSessionCache();
  clearDashboardCache();
  clearProjectsCache();
  res.json({ success: true, message: 'Cache cleared' });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Token Spend Dashboard API server running on http://localhost:${PORT}`);
  console.log(`  Sessions:  GET  /api/sessions?project=`);
  console.log(`  Detail:    GET  /api/sessions/:id`);
  console.log(`  Dashboard: GET  /api/dashboard`);
  console.log(`  Projects:  GET  /api/projects`);
  console.log(`  Refresh:   POST /api/refresh`);
});

import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { csrfProtection } from './middleware/csrf.js';

// Routes
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import dashboardRoutes from './routes/dashboard.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import timeEntryRoutes from './routes/timeEntries.js';
import invoiceRoutes from './routes/invoices.js';
import proposalRoutes from './routes/proposals.js';
import contractRoutes from './routes/contracts.js';
import portalRoutes from './routes/portal.js';
import webhookRoutes from './routes/webhooks.js';
import opportunityRoutes from './routes/opportunities.js';

const app = express();

// ── Webhook must get raw body BEFORE the global JSON parser ──────────────────
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Requested-With', 'Authorization'],
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ── CSRF protection ───────────────────────────────────────────────────────────
app.use(csrfProtection);

// ── Global rate limit ─────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
}

// ── Trust proxy (for IP in signatures) ───────────────────────────────────────
app.set('trust proxy', 1);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/time-entries', timeEntryRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1', proposalRoutes);
app.use('/api/v1', contractRoutes);
app.use('/api/v1', portalRoutes);
app.use('/api/v1/opportunities', opportunityRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

app.use(errorHandler);

export default app;

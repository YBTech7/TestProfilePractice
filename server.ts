import 'dotenv/config';
import {
  consultationInbox,
  getConsultationMailerConfig,
  runConsultationMailer,
} from './consultation.ts';
import express from 'express';
import type { Request, Response, NextFunction, Express } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import {
  INITIAL_FAQS,
  INITIAL_INSIGHTS,
  INITIAL_PROJECTS,
  SERVICE_OFFERINGS,
  CLIENT_TIER_SOLUTIONS,
  WORKFLOW_VISUAL_URL,
} from './src/data/profileData.ts';
import {
  isValidCountryCode,
  validateAndNormalizePhone,
} from './src/lib/phone.ts';
import type {
  AiScopeRecommendation,
  BrandSettings,
  ClientTierId,
  FaqItem,
  InquiryRecord,
  InquiryStatus,
  InsightArticle,
  ProjectCase,
  ServiceDomainId,
} from './src/types.ts';

interface PersistentStore {
  inquiries: InquiryRecord[];
  projects: ProjectCase[];
  insights: InsightArticle[];
  faqs: FaqItem[];
  brand: BrandSettings;
}

const VALID_TIERS: ClientTierId[] = ['individual', 'startup', 'smb', 'enterprise'];
const VALID_SERVICES: ServiceDomainId[] = [
  'technical-support',
  'customer-service',
  'data-analytics',
  'admin-operations',
  'account-management',
  'web-creation',
];
const VALID_STATUSES: InquiryStatus[] = ['New', 'In Review', 'Scheduled', 'Completed'];
const ALLOWED_RASTER_DATA_URL_RE = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB decoded limit
const ADMIN_TOKEN_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours
const GEMINI_TIMEOUT_MS = 20000;

const DATA_DIR = path.resolve(process.cwd(), 'data');

function getStorePath(): string {
  return process.env.DATA_STORE_PATH
    ? path.resolve(process.env.DATA_STORE_PATH)
    : path.join(DATA_DIR, 'store.json');
}

const DEFAULT_BRAND: BrandSettings = {
  customPortraitDataUrl: null,
  customLogoDataUrl: null,
  motionEnabled: true,
  motionSensitivity: 1,
};

let memoryStore: PersistentStore | null = null;

export function resetServerStateForTests(): void {
  memoryStore = null;
  activeAdminTokens.clear();
  rateLimitBuckets.clear();
  loginFailureBuckets.clear();
}

function normalizeAssetPath(imageUrl: string): string {
  if (!imageUrl) return WORKFLOW_VISUAL_URL;
  if (imageUrl.startsWith('/src/assets/')) {
    return imageUrl.slice(5);
  }
  if (imageUrl.startsWith('/assets/')) {
    return imageUrl.slice(1);
  }
  return imageUrl;
}

function createInitialStore(): PersistentStore {
  return {
    inquiries: [
      {
        id: 'INQ-2026-SAMPLE01',
        name: 'Elena Rostova',
        email: 'elena@northstar-ops.example',
        company: 'Northstar Logistics',
        tier: 'smb',
        serviceDomain: 'data-analytics',
        timeline: 'Within 30 days',
        message:
          'Looking to consolidate weekly customer support and account renewal spreadsheets into a single executive KPI dashboard.',
        status: 'In Review',
        createdAt: '2026-11-15T14:20:00.000Z',
        notes: 'Sample development record.',
      },
    ],
    projects: INITIAL_PROJECTS,
    insights: INITIAL_INSIGHTS,
    faqs: INITIAL_FAQS,
    brand: DEFAULT_BRAND,
  };
}

function ensureStore(): PersistentStore {
  if (memoryStore) {
    return memoryStore;
  }

  const storePath = getStorePath();
  const dir = path.dirname(storePath);

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(storePath)) {
      const initial = createInitialStore();
      fs.writeFileSync(storePath, JSON.stringify(initial, null, 2), 'utf-8');
      memoryStore = initial;
      return initial;
    }

    const raw = fs.readFileSync(storePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PersistentStore>;
    const projects =
      Array.isArray(parsed.projects) && parsed.projects.length > 0
        ? parsed.projects.map((p) => ({
            ...p,
            imageUrl: normalizeAssetPath(p.imageUrl),
          }))
        : INITIAL_PROJECTS;

    const hydrated: PersistentStore = {
      inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
      projects,
      insights:
        Array.isArray(parsed.insights) && parsed.insights.length > 0
          ? parsed.insights
          : INITIAL_INSIGHTS,
      faqs:
        Array.isArray(parsed.faqs) && parsed.faqs.length > 0
          ? parsed.faqs
          : INITIAL_FAQS,
      brand: { ...DEFAULT_BRAND, ...(parsed.brand || {}) },
    };
    memoryStore = hydrated;
    return hydrated;
  } catch {
    memoryStore = createInitialStore();
    return memoryStore;
  }
}

function saveStore(store: PersistentStore): void {
  memoryStore = store;
  const storePath = getStorePath();
  const dir = path.dirname(storePath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Keep updated in memoryStore if filesystem is read-only
  }
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please configure GEMINI_API_KEY on the server.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getGeminiModel(): string {
  return (process.env.GEMINI_MODEL || 'gemini-4-hydrogen').trim();
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const SYSTEM_CONTEXT = `You are the Service Advisor for Pio Languisan (PL — Technology · Operations · Analytics).
Your role is to help prospective individual, startup, small-to-medium business (SMB), and enterprise clients understand how Pio's actual experience applies to their goals.

Core Service Pillars:
${SERVICE_OFFERINGS.map(
  (s) => `- ${s.index}. ${s.title} (${s.id}): ${s.summary} Deliverables: ${s.deliverables.join(', ')}.`
).join('\n')}

Client Tiers:
${CLIENT_TIER_SOLUTIONS.map(
  (t) => `- ${t.label} (${t.id}): ${t.description} Typical timeline: ${t.typicalTimeline}.`
).join('\n')}

Guidelines:
1. Be concise, executive, practical, and grounded strictly in the six service areas above (technical support, customer service, data analytics, administrative operations, account management, and web creation).
2. Never invent fabricated past employers, degrees, certifications, or fake client names.
3. Recommend concrete deliverables and suggest scheduling a consultation when ready.`;

const activeAdminTokens = new Map<string, number>();
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const loginFailureBuckets = new Map<string, { failures: number; lockedUntil: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function createRateLimiter(bucketPrefix: string, maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${bucketPrefix}:${getClientIp(req)}`;
    const now = Date.now();
    const existing = rateLimitBuckets.get(key);
    if (!existing || now > existing.resetAt) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (existing.count >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        error: `Too many requests. Please retry in ${retryAfterSec} seconds.`,
      });
      return;
    }
    existing.count += 1;
    next();
  };
}

function pruneExpiredTokens(): void {
  const now = Date.now();
  for (const [tok, exp] of activeAdminTokens.entries()) {
    if (now > exp) {
      activeAdminTokens.delete(tok);
    }
  }
}

function timingSafeMatch(provided: string, expected: string): boolean {
  const providedHash = crypto.createHash('sha256').update(provided).digest();
  const expectedHash = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(providedHash, expectedHash);
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  pruneExpiredTokens();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const expiresAt = activeAdminTokens.get(token);
  if (!expiresAt || Date.now() > expiresAt) {
    activeAdminTokens.delete(token);
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
    return;
  }
  next();
}

function validateRasterDataUrl(value: unknown): { valid: boolean; error?: string } {
  if (value === null) return { valid: true };
  if (typeof value !== 'string') {
    return { valid: false, error: 'Image upload must be a valid data URL or null.' };
  }
  const match = value.match(ALLOWED_RASTER_DATA_URL_RE);
  if (!match) {
    return {
      valid: false,
      error: 'Only PNG, JPEG, or WebP image uploads are permitted.',
    };
  }
  const base64Body = match[2];
  const approxBytes = Math.floor((base64Body.length * 3) / 4);
  if (approxBytes > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      error: 'Uploaded image exceeds the 2MB maximum size limit.',
    };
  }
  return { valid: true };
}

function sanitizeScopeOutput(parsed: Record<string, unknown>): AiScopeRecommendation {
  const rawTier = String(parsed.recommendedTier || '').trim() as ClientTierId;
  const rawService = String(parsed.recommendedService || '').trim() as ServiceDomainId;
  const recommendedTier: ClientTierId = VALID_TIERS.includes(rawTier) ? rawTier : 'startup';
  const recommendedService: ServiceDomainId = VALID_SERVICES.includes(rawService)
    ? rawService
    : 'technical-support';
  const recommendedTimeline = String(parsed.recommendedTimeline || 'Within 30 days')
    .trim()
    .slice(0, 60);
  const executiveSummary = String(
    parsed.executiveSummary || 'Structured discovery sprint tailored to your operational goals.'
  )
    .trim()
    .slice(0, 500);
  const actionPlan = Array.isArray(parsed.actionPlan)
    ? parsed.actionPlan
        .map((step) => String(step).trim().slice(0, 180))
        .filter(Boolean)
        .slice(0, 5)
    : ['Audit current workflows', 'Establish reporting baseline', 'Execute sprint deliverables'];

  return {
    recommendedTier,
    recommendedService,
    recommendedTimeline,
    executiveSummary,
    actionPlan: actionPlan.length > 0 ? actionPlan : ['Audit current workflows'],
  };
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('GEMINI_API_KEY')) {
    return {
      status: 503,
      message: 'AI Service Advisor is not configured on this server.',
    };
  }
  if (msg.includes('GEMINI_TIMEOUT')) {
    return {
      status: 504,
      message: 'AI Service Advisor timed out. Please try again in a moment.',
    };
  }
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message: 'AI service credentials could not be validated.',
    };
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'AI service quota temporarily reached. Please retry shortly.',
    };
  }
  return {
    status: 502,
    message: 'Unable to process AI guidance request right now.',
  };
}

export function createApiApp(): Express {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';

  app.disable('x-powered-by');
  app.use(express.json({ limit: '3mb' }));

  // HTTP Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.path.startsWith('/api/')) {
      res.setHeader('X-Frame-Options', 'DENY');
    }
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (isProd) {
      const frameAncestors = req.path.startsWith('/api/') ? "'none'" : '*';
      res.setHeader(
        'Content-Security-Policy',
        `default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-ancestors ${frameAncestors};`
      );
    }
    next();
  });

  // CORS for decoupled static frontend (e.g., GitHub Pages) -> Backend API
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    const mailerConfig = getConsultationMailerConfig();
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      adminConfigured: Boolean(process.env.ADMIN_PASSCODE),
      consultationStorage: consultationInbox ? 'postgres' : 'file',
      consultationMailerConfigured: Boolean(mailerConfig),
      consultationSameSenderRecipient: mailerConfig ? mailerConfig.sameSenderRecipient : null,
    });
  });

  app.get('/api/content', (_req, res) => {
    const store = ensureStore();
    res.json({
      projects: store.projects,
      insights: store.insights,
      faqs: store.faqs,
      brand: store.brand,
    });
  });

  const inquiryLimiter = createRateLimiter('inquiries', 10, 15 * 60 * 1000);
  app.post('/api/inquiries', inquiryLimiter, async (req, res) => {
    const {
      name,
      email,
      phone,
      phoneCountry,
      company,
      tier,
      serviceDomain,
      timeline,
      message,
      website,
    } = req.body ?? {};

    // Honeypot spam trap
    if (typeof website === 'string' && website.trim().length > 0) {
      res.status(201).json({
        inquiry: {
          id: `INQ-${new Date().getFullYear()}-ACCEPTED`,
          name: 'Submitted',
          email: '',
          company: '',
          tier: 'startup',
          serviceDomain: 'technical-support',
          timeline: 'Within 30 days',
          message: '',
          status: 'New',
          createdAt: new Date().toISOString(),
        },
      });
      return;
    }

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';
    const trimmedCompany = typeof company === 'string' ? company.trim() : '';
    const trimmedTimeline = typeof timeline === 'string' ? timeline.trim() : 'Within 30 days';
    const trimmedMessage = typeof message === 'string' ? message.trim() : '';

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      res.status(400).json({ error: 'Full name must be between 2 and 100 characters.' });
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail) || trimmedEmail.length > 160) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    const rawCountry =
      typeof phoneCountry === 'string' && isValidCountryCode(phoneCountry)
        ? (phoneCountry.toUpperCase() as Parameters<typeof validateAndNormalizePhone>[1])
        : undefined;
    const phoneCheck = validateAndNormalizePhone(phone, rawCountry);
    if (!phoneCheck.valid) {
      res.status(400).json({
        error: phoneCheck.error || 'Please enter a valid international contact number.',
      });
      return;
    }
    if (trimmedCompany.length > 120) {
      res.status(400).json({ error: 'Organization name must be 120 characters or fewer.' });
      return;
    }
    if (!VALID_TIERS.includes(tier)) {
      res.status(400).json({ error: 'Invalid organization tier selected.' });
      return;
    }
    if (!VALID_SERVICES.includes(serviceDomain)) {
      res.status(400).json({ error: 'Invalid service domain selected.' });
      return;
    }
    if (trimmedTimeline.length === 0 || trimmedTimeline.length > 60) {
      res.status(400).json({ error: 'Please choose a valid target timeline.' });
      return;
    }
    if (trimmedMessage.length < 10 || trimmedMessage.length > 2500) {
      res.status(400).json({
        error: 'Project context must be between 10 and 2500 characters.',
      });
      return;
    }

    const record: InquiryRecord = {
      id: `INQ-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      name: trimmedName,
      email: trimmedEmail,
      ...(phoneCheck.e164 ? { phone: phoneCheck.e164 } : {}),
      company: trimmedCompany || (consultationInbox ? '' : 'Independent'),
      tier,
      serviceDomain,
      timeline: trimmedTimeline,
      message: trimmedMessage,
      status: 'New',
      createdAt: new Date().toISOString(),
    };

    const key = req.body?.submissionKey;
    if (key !== undefined && (typeof key !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key))) {
      res.status(400).json({ error: 'Invalid submission reference.' });
      return;
    }
    try {
      if (consultationInbox) {
        const inquiry = await consultationInbox.save(record, key ?? crypto.randomUUID());
        if (!inquiry) {
          res.status(409).json({ error: 'The submission reference is already in use. Please try again.' });
          return;
        }
        console.info('Consultation inquiry recorded', {
          inquiryId: inquiry.id,
          httpStatus: 201,
          stage: 'database_save',
          storage: 'postgres',
          deduplicated: inquiry.id !== record.id,
        });
        res.status(201).json({ inquiry });
        return;
      }
      if (process.env.RAILWAY_ENVIRONMENT_NAME === 'production') {
        console.error('Consultation storage is missing its production database connection.');
        res.status(503).json({ error: 'We could not save your request. Please try again.' });
        return;
      }
      const store = structuredClone(ensureStore());
      store.inquiries.unshift(record);
      saveStore(store);
      console.info('Consultation inquiry recorded', {
        inquiryId: record.id,
        httpStatus: 201,
        stage: 'file_save',
        storage: 'file',
        deduplicated: false,
      });
      res.status(201).json({ inquiry: record });
    } catch {
      console.error('Consultation storage failed', {
        inquiryId: record.id,
        httpStatus: 503,
        stage: 'database_save',
      });
      res.status(503).json({ error: 'We could not save your request. Please try again.' });
    }
  });

  const aiLimiter = createRateLimiter('assistant', 20, 5 * 60 * 1000);
  app.post('/api/assistant', aiLimiter, async (req, res) => {
    try {
      const { messages } = req.body ?? {};
      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Conversation messages are required.' });
        return;
      }

      const sanitized = messages.slice(-10).map((m: { role?: unknown; content?: unknown }) => ({
        role: m?.role === 'assistant' ? 'Advisor' : 'Client',
        content: typeof m?.content === 'string' ? m.content.trim().slice(0, 1500) : '',
      }));

      if (!sanitized.some((m) => m.content.length > 0)) {
        res.status(400).json({ error: 'Message content cannot be empty.' });
        return;
      }

      const ai = getGeminiClient();
      const transcript = sanitized
        .filter((m) => m.content.length > 0)
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n\n');

      const response = await withTimeout(
        ai.models.generateContent({
          model: getGeminiModel(),
          contents: `Respond directly to the latest Client message in this conversation:\n\n${transcript}`,
          config: {
            systemInstruction: SYSTEM_CONTEXT,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        GEMINI_TIMEOUT_MS
      );

      const reply = response.text?.trim();
      if (!reply) {
        res.status(502).json({ error: 'No response generated. Please try rephrasing your question.' });
        return;
      }

      res.json({ reply });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/assistant/scope', aiLimiter, async (req, res) => {
    try {
      const { goal } = req.body ?? {};
      const trimmedGoal = typeof goal === 'string' ? goal.trim() : '';
      if (trimmedGoal.length < 5 || trimmedGoal.length > 1000) {
        res.status(400).json({
          error: 'Goal description must be between 5 and 1000 characters.',
        });
        return;
      }

      const ai = getGeminiClient();
      const response = await withTimeout(
        ai.models.generateContent({
          model: getGeminiModel(),
          contents: `Evaluate this prospective client goal and map it to Pio Languisan's services:\n"${trimmedGoal}"`,
          config: {
            systemInstruction: SYSTEM_CONTEXT,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recommendedTier: {
                  type: Type.STRING,
                  description: "Must be one of: 'individual', 'startup', 'smb', 'enterprise'",
                },
                recommendedService: {
                  type: Type.STRING,
                  description:
                    "Must be one of: 'technical-support', 'customer-service', 'data-analytics', 'admin-operations', 'account-management', 'web-creation'",
                },
                recommendedTimeline: {
                  type: Type.STRING,
                  description: "Suggested engagement timeline, e.g. 'Within 30 days' or '2–4 Weeks'",
                },
                executiveSummary: {
                  type: Type.STRING,
                  description: 'Concise 2-sentence executive summary of the recommended scope.',
                },
                actionPlan: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 concrete milestone steps for the initial sprint.',
                },
              },
              required: [
                'recommendedTier',
                'recommendedService',
                'recommendedTimeline',
                'executiveSummary',
                'actionPlan',
              ],
            },
          },
        }),
        GEMINI_TIMEOUT_MS
      );

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const scope = sanitizeScopeOutput(parsed);
      res.json({ scope });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/admin/login', (req, res) => {
    const expected = process.env.ADMIN_PASSCODE?.trim();
    if (!expected) {
      res.status(503).json({
        error: 'Administrator authentication is not configured on this server. Set ADMIN_PASSCODE in server environment variables.',
      });
      return;
    }

    const ip = getClientIp(req);
    const now = Date.now();
    const record = loginFailureBuckets.get(ip);
    if (record && record.lockedUntil > now) {
      const waitSec = Math.max(1, Math.ceil((record.lockedUntil - now) / 1000));
      res.setHeader('Retry-After', String(waitSec));
      res.status(429).json({
        error: `Too many failed login attempts. Try again in ${waitSec} seconds.`,
      });
      return;
    }

    const { passcode } = req.body ?? {};
    const supplied = typeof passcode === 'string' ? passcode.trim() : '';

    if (!supplied || !timingSafeMatch(supplied, expected)) {
      const current =
        record && now <= record.resetAt
          ? record
          : { failures: 0, lockedUntil: 0, resetAt: now + 15 * 60 * 1000 };
      current.failures += 1;
      if (current.failures >= 5) {
        current.lockedUntil = now + 15 * 60 * 1000;
      }
      loginFailureBuckets.set(ip, current);
      res.status(401).json({ error: 'Invalid executive passcode.' });
      return;
    }

    loginFailureBuckets.delete(ip);
    pruneExpiredTokens();
    const token = crypto.randomBytes(32).toString('hex');
    activeAdminTokens.set(token, Date.now() + ADMIN_TOKEN_TTL_MS);
    res.json({ token, expiresInMs: ADMIN_TOKEN_TTL_MS });
  });

  app.post('/api/admin/logout', requireAdmin, (req, res) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (token) {
      activeAdminTokens.delete(token);
    }
    res.json({ ok: true });
  });

  app.get('/api/admin/dashboard', requireAdmin, async (_req, res) => {
    try {
      const store = ensureStore();
      const records = consultationInbox ? await consultationInbox.list() : [];
      const ids = new Set(records.map((record) => record.id));
      res.json({
        inquiries: [...records, ...store.inquiries.filter((record) => !ids.has(record.id))],
        projects: store.projects,
        brand: store.brand,
      });
    } catch {
      res.status(503).json({ error: 'The inquiry inbox is temporarily unavailable.' });
    }
  });

  app.patch('/api/admin/inquiries/:id', requireAdmin, async (req, res) => {
    const { status, notes } = req.body ?? {};
    const changes: Partial<InquiryRecord> = {};
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        res.status(400).json({ error: 'Invalid inquiry status value.' });
        return;
      }
      changes.status = status;
    }
    if (notes !== undefined) {
      if (typeof notes !== 'string' || notes.length > 1000) {
        res.status(400).json({ error: 'Notes must be a string of 1000 characters or fewer.' });
        return;
      }
      changes.notes = notes.trim();
    }
    try {
      const saved = consultationInbox && await consultationInbox.update(req.params.id, changes);
      if (saved) {
        console.info('Consultation inquiry updated', {
          inquiryId: saved.id,
          httpStatus: 200,
          stage: 'admin_update',
          status: saved.status,
        });
        res.json({ inquiry: saved });
        return;
      }
      const store = structuredClone(ensureStore());
      const target = store.inquiries.find((item) => item.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'Inquiry not found.' });
        return;
      }
      Object.assign(target, changes);
      saveStore(store);
      console.info('Consultation inquiry updated', {
        inquiryId: target.id,
        httpStatus: 200,
        stage: 'admin_update',
        status: target.status,
      });
      res.json({ inquiry: target });
    } catch {
      console.error('Consultation inquiry update failed', {
        inquiryId: req.params.id,
        httpStatus: 503,
        stage: 'admin_update',
      });
      res.status(503).json({ error: 'The inquiry could not be updated. Please try again.' });
    }
  });

  app.post('/api/admin/projects', requireAdmin, (req, res) => {
    const { title, domain, tier, timeframe, metricValue, metricLabel, summary, architecture } =
      req.body ?? {};
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedDomain = typeof domain === 'string' ? domain.trim() : '';
    const trimmedSummary = typeof summary === 'string' ? summary.trim() : '';

    if (trimmedTitle.length < 3 || trimmedTitle.length > 140) {
      res.status(400).json({ error: 'Title must be between 3 and 140 characters.' });
      return;
    }
    if (trimmedDomain.length < 2 || trimmedDomain.length > 80) {
      res.status(400).json({ error: 'Domain must be between 2 and 80 characters.' });
      return;
    }
    if (trimmedSummary.length < 10 || trimmedSummary.length > 1200) {
      res.status(400).json({ error: 'Summary must be between 10 and 1200 characters.' });
      return;
    }

    const store = ensureStore();
    const newProject: ProjectCase = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      title: trimmedTitle,
      domain: trimmedDomain,
      tier: String(tier || 'SMB & Enterprise').trim().slice(0, 60),
      timeframe: String(timeframe || '4 Weeks').trim().slice(0, 40),
      metricValue: String(metricValue || '+35%').trim().slice(0, 24),
      metricLabel: String(metricLabel || 'Operational efficiency gain').trim().slice(0, 100),
      summary: trimmedSummary,
      architecture: Array.isArray(architecture)
        ? architecture
            .map((a) => String(a).trim().slice(0, 200))
            .filter(Boolean)
            .slice(0, 8)
        : ['Structured operational framework', 'Automated reporting baseline'],
      imageUrl: WORKFLOW_VISUAL_URL,
    };
    store.projects.unshift(newProject);
    saveStore(store);
    res.status(201).json({ project: newProject, projects: store.projects });
  });

  app.delete('/api/admin/projects/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const store = ensureStore();
    const next = store.projects.filter((p) => p.id !== id);
    if (next.length === store.projects.length) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    store.projects = next;
    saveStore(store);
    res.json({ projects: store.projects });
  });

  app.post('/api/admin/brand', requireAdmin, (req, res) => {
    const { customLogoDataUrl, motionEnabled, motionSensitivity } = req.body ?? {};
    if (customLogoDataUrl !== undefined) {
      const check = validateRasterDataUrl(customLogoDataUrl);
      if (!check.valid) {
        res.status(400).json({ error: check.error });
        return;
      }
    }

    const store = ensureStore();
    store.brand = {
      // Preserve static original portrait policy
      customPortraitDataUrl: null,
      customLogoDataUrl:
        customLogoDataUrl === undefined ? store.brand.customLogoDataUrl : customLogoDataUrl,
      motionEnabled:
        typeof motionEnabled === 'boolean' ? motionEnabled : store.brand.motionEnabled,
      motionSensitivity:
        typeof motionSensitivity === 'number'
          ? Math.min(2, Math.max(0, motionSensitivity))
          : store.brand.motionSensitivity,
    };
    saveStore(store);
    res.json({ brand: store.brand });
  });

  return app;
}

async function startServer() {
  const app = createApiApp();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(
      express.static(distPath, {
        maxAge: '1h',
        setHeaders: (res, filePath) => {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (consultationInbox) runConsultationMailer(consultationInbox);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

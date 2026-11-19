import postgres from 'postgres';
import type { InquiryRecord } from './src/types.ts';

type EmailState = 'pending' | 'sending' | 'sent' | 'review';
type Row = { inquiry: InquiryRecord; email_state: EmailState };
type Job = { id: string; inquiry: InquiryRecord; attempts: number };
const emailAddress = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export function openInbox(url: string) {
  const sql = postgres(url, { max: 3, connect_timeout: 5 });
  let initialized: Promise<void> | undefined;
  const ready = () => initialized ??= sql`
    CREATE TABLE IF NOT EXISTS consultation_inbox (
      id text PRIMARY KEY,
      submission_key uuid UNIQUE NOT NULL,
      inquiry jsonb NOT NULL,
      email_state text NOT NULL DEFAULT 'pending',
      attempts integer NOT NULL DEFAULT 0,
      next_attempt timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      provider_id text
    )
  `.then(async () => {
    await sql`
      UPDATE consultation_inbox
      SET inquiry = (inquiry #>> '{}')::jsonb,
          email_state = 'pending', next_attempt = now(), attempts = 0,
          provider_id = NULL, updated_at = now()
      WHERE jsonb_typeof(inquiry) = 'string'
    `;
  }).catch((error: unknown) => {
    initialized = undefined;
    throw error;
  });

  return {
    close: () => sql.end(),
    async save(inquiry: InquiryRecord, key: string) {
      await ready();
      const [row] = await sql<{ inquiry: InquiryRecord }[]>`
        INSERT INTO consultation_inbox (id, submission_key, inquiry)
        VALUES (${inquiry.id}, ${key}, ${sql.json({ ...inquiry })})
        ON CONFLICT (submission_key) DO UPDATE SET submission_key = EXCLUDED.submission_key
        WHERE (consultation_inbox.inquiry - ARRAY['id', 'createdAt', 'status', 'notes'])
            = (EXCLUDED.inquiry - ARRAY['id', 'createdAt', 'status', 'notes'])
        RETURNING inquiry
      `;
      return row?.inquiry ?? null;
    },
    async list() {
      await ready();
      const rows = await sql<Row[]>`
        SELECT inquiry, email_state FROM consultation_inbox ORDER BY inquiry->>'createdAt' DESC
      `;
      return rows.map(({ inquiry, email_state }) => ({ ...inquiry, emailStatus: email_state }));
    },
    async update(id: string, changes: Partial<InquiryRecord>) {
      await ready();
      const [row] = await sql<Row[]>`
        UPDATE consultation_inbox
        SET inquiry = inquiry || ${sql.json({ ...changes })}
        WHERE id = ${id} RETURNING inquiry, email_state
      `;
      return row && { ...row.inquiry, emailStatus: row.email_state };
    },
    async claim() {
      await ready();
      await sql`
        UPDATE consultation_inbox SET email_state = 'review'
        WHERE email_state = 'sending' AND updated_at < now() - interval '5 minutes'
      `;
      const [job] = await sql<Job[]>`
        WITH candidate AS (
          SELECT id FROM consultation_inbox
          WHERE email_state = 'pending' AND next_attempt <= now()
          ORDER BY next_attempt, id LIMIT 1 FOR UPDATE SKIP LOCKED
        )
        UPDATE consultation_inbox AS inbox
        SET email_state = 'sending', attempts = attempts + 1, updated_at = now()
        FROM candidate WHERE inbox.id = candidate.id
        RETURNING inbox.id, inbox.inquiry, inbox.attempts
      `;
      return job;
    },
    async finish(job: Job, state: EmailState, providerId: string | null = null) {
      const retrySeconds = Math.min(60 * 2 ** job.attempts, 1800);
      await sql`
        UPDATE consultation_inbox
        SET email_state = ${state}, provider_id = ${providerId}, updated_at = now(),
            next_attempt = now() + ${retrySeconds} * interval '1 second'
        WHERE id = ${job.id} AND email_state = 'sending' AND attempts = ${job.attempts}
      `;
    },
  };
}

const databaseUrl = process.env.CONSULTATION_DATABASE_URL;
let consultationInbox: ReturnType<typeof openInbox> | null = null;
if (databaseUrl) {
  try {
    consultationInbox = openInbox(databaseUrl);
  } catch (err) {
    console.warn('[AI Studio] PostgreSQL not connected — falling back to local store:', err);
    consultationInbox = null;
  }
}
export { consultationInbox };

const tiers = { individual: 'Individual', startup: 'Startup', smb: 'Small or medium business', enterprise: 'Enterprise' };
const services = {
  'technical-support': 'Technical Support & Systems',
  'customer-service': 'Customer Service Operations',
  'data-analytics': 'Data Analytics & Executive Reporting',
  'admin-operations': 'Administrative & Business Operations',
  'account-management': 'Strategic Account Management',
  'web-creation': 'Web Creation & AI Workflows',
};

export function formatConsultationEmailBody(inquiry: InquiryRecord): string {
  const phoneDisplay =
    typeof inquiry.phone === 'string' && inquiry.phone.trim().length > 0
      ? inquiry.phone.trim()
      : 'Not provided';
  return [
    'Tracking ID: ' + inquiry.id,
    'Submitted (UTC): ' + inquiry.createdAt,
    '',
    'Full name: ' + inquiry.name,
    'Email address: ' + inquiry.email,
    'Contact number: ' + phoneDisplay,
    'Organization / Practice: ' + (inquiry.company || 'Not provided'),
    'Organization tier: ' + tiers[inquiry.tier],
    'Primary service domain: ' + services[inquiry.serviceDomain],
    'Target timeline: ' + inquiry.timeline,
    '',
    'Project context & objectives:',
    inquiry.message,
  ].join('\r\n');
}

export function messageFor(inquiry: InquiryRecord, from: string, to: string) {
  const body = formatConsultationEmailBody(inquiry);
  const bodyLines = Buffer.from(body).toString('base64').match(/.{1,76}/g) ?? [];
  return Buffer.from([
    'From: ' + from,
    'To: ' + to,
    ...(emailAddress.test(inquiry.email) ? ['Reply-To: ' + inquiry.email] : []),
    'Subject: New consultation request - ' + inquiry.id,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    ...bodyLines,
  ].join('\r\n')).toString('base64url');
}

export function getConsultationMailerConfig() {
  const from = process.env.CONSULTATION_EMAIL_FROM ?? '';
  const to = process.env.CONSULTATION_EMAIL_TO ?? '';
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;
  if (!emailAddress.test(from) || !emailAddress.test(to) ||
      !GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    return null;
  }
  return {
    from, to, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN,
    sameSenderRecipient: from.toLowerCase() === to.toLowerCase(),
  };
}

export function runConsultationMailer(inbox: ReturnType<typeof openInbox>) {
  const config = getConsultationMailerConfig();
  if (!config) {
    console.warn('Consultation emails are queued until Gmail is configured.');
    return;
  }
  const { from, to, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = config;

  async function deliver(job: Job) {
    const retry = job.attempts < 5 ? 'pending' : 'review';
    let tokenResponse: Response;
    try {
      tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: GMAIL_CLIENT_ID,
          client_secret: GMAIL_CLIENT_SECRET,
          refresh_token: GMAIL_REFRESH_TOKEN,
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      await inbox.finish(job, retry);
      return;
    }
    if (!tokenResponse.ok) {
      console.warn('Consultation Gmail token request failed', { status: tokenResponse.status });
      await inbox.finish(job, tokenResponse.status >= 500 || tokenResponse.status === 429 ? retry : 'review');
      return;
    }

    const token = await tokenResponse.json().catch(() => null) as { access_token?: string } | null;
    if (typeof token?.access_token !== 'string' || !token.access_token.trim()) {
      console.warn('Consultation Gmail token response did not include an access token', { inquiryId: job.id });
      await inbox.finish(job, retry);
      return;
    }
    let response: Response;
    try {
      response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: messageFor(job.inquiry, from, to) }),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      // Gmail has no send idempotency key. An uncertain outcome needs manual review.
      await inbox.finish(job, 'review');
      return;
    }
    if (!response.ok) {
      console.warn('Consultation Gmail send failed', { inquiryId: job.id, status: response.status });
      await inbox.finish(job, response.status === 429 ? retry : 'review');
      return;
    }
    const result = await response.json().catch(() => null) as { id?: string } | null;
    await inbox.finish(job, 'sent', result?.id ?? null);
    console.info('Gmail accepted consultation notification', { inquiryId: job.id });
  }

  async function poll() {
    try {
      const job = await inbox.claim();
      if (job) await deliver(job);
    } catch {
      console.error('Consultation mail queue could not be processed.');
    } finally {
      setTimeout(poll, 5000).unref();
    }
  }
  void poll();
}

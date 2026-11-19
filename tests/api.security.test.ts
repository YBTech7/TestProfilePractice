import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApiApp, resetServerStateForTests } from '../server.ts';
import { resolveAssetUrl } from '../src/data/profileData.ts';

describe('Asset URL Resolution', () => {
  it('normalizes relative, leading-slash, and legacy /src/assets paths for root base', () => {
    expect(resolveAssetUrl('assets/images/example.jpg', '/')).toBe('/assets/images/example.jpg');
    expect(resolveAssetUrl('/assets/images/example.jpg', '/')).toBe('/assets/images/example.jpg');
    expect(resolveAssetUrl('/src/assets/images/example.jpg', '/')).toBe('/assets/images/example.jpg');
  });

  it('prefixes assets properly for GitHub Pages subpath deployment', () => {
    expect(resolveAssetUrl('assets/images/example.jpg', '/PioOrlyLanguisan/')).toBe(
      '/PioOrlyLanguisan/assets/images/example.jpg'
    );
    expect(resolveAssetUrl('/src/assets/images/example.jpg', '/PioOrlyLanguisan/')).toBe(
      '/PioOrlyLanguisan/assets/images/example.jpg'
    );
    expect(resolveAssetUrl('data:image/png;base64,AAAA', '/PioOrlyLanguisan/')).toBe(
      'data:image/png;base64,AAAA'
    );
    expect(resolveAssetUrl('https://example.com/a.png', '/PioOrlyLanguisan/')).toBe(
      'https://example.com/a.png'
    );
  });
});

describe('API & Security Hardening', () => {
  let server: http.Server;
  let baseUrl: string;
  let tempStorePath: string;
  const originalEnv = {
    ADMIN_PASSCODE: process.env.ADMIN_PASSCODE,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    DATA_STORE_PATH: process.env.DATA_STORE_PATH,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  };

  beforeAll(async () => {
    tempStorePath = path.join(os.tmpdir(), `pio-api-test-${process.pid}-${Date.now()}.json`);
    process.env.DATA_STORE_PATH = tempStorePath;
    process.env.ALLOWED_ORIGINS = 'https://ybtech7.github.io';
    delete process.env.GEMINI_API_KEY;
    process.env.ADMIN_PASSCODE = 'Test-Strong-Passcode-99!';
    resetServerStateForTests();

    const app = createApiApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterEach(() => {
    resetServerStateForTests();
    process.env.ADMIN_PASSCODE = 'Test-Strong-Passcode-99!';
    delete process.env.GEMINI_API_KEY;
    if (fs.existsSync(tempStorePath)) {
      fs.unlinkSync(tempStorePath);
    }
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    if (fs.existsSync(tempStorePath)) {
      fs.unlinkSync(tempStorePath);
    }
    process.env.ADMIN_PASSCODE = originalEnv.ADMIN_PASSCODE;
    process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
    process.env.DATA_STORE_PATH = originalEnv.DATA_STORE_PATH;
    process.env.ALLOWED_ORIGINS = originalEnv.ALLOWED_ORIGINS;
  });

  it('serves health metadata and security headers without x-powered-by', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-powered-by')).toBeNull();
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.geminiConfigured).toBe(false);
    expect(body.adminConfigured).toBe(true);
    expect(body.consultationStorage).toBe('file');
    expect(body.consultationMailerConfigured).toBe(false);
  });

  it('applies strict CORS origin allowlist', async () => {
    const allowed = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://ybtech7.github.io' },
    });
    expect(allowed.headers.get('access-control-allow-origin')).toBe('https://ybtech7.github.io');

    const disallowed = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://evil.example.com' },
    });
    expect(disallowed.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('returns content with clean subpath-safe asset URLs', async () => {
    const res = await fetch(`${baseUrl}/api/content`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.projects)).toBe(true);
    expect(data.projects.length).toBeGreaterThanOrEqual(3);
    for (const p of data.projects) {
      expect(p.imageUrl).not.toContain('/src/assets/');
      expect(p.imageUrl.startsWith('assets/')).toBe(true);
    }
    expect(data.brand.customPortraitDataUrl).toBeNull();
  });

  it('validates inquiries, accepts valid submissions with unique IDs, traps honeypot, and enforces rate limit', async () => {
    // Reject invalid email & short message
    const invalid = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        email: 'not-an-email',
        tier: 'startup',
        serviceDomain: 'data-analytics',
        message: 'short',
      }),
    });
    expect(invalid.status).toBe(400);

    // Reject unknown tier enum
    const invalidTier = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Rivera',
        email: 'alex@example.com',
        tier: 'megacorp',
        serviceDomain: 'data-analytics',
        message: 'Need a structured weekly KPI model across 3 teams.',
      }),
    });
    expect(invalidTier.status).toBe(400);

    // Honeypot submission does not persist
    const honeypot = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Spam Bot',
        email: 'bot@example.com',
        tier: 'startup',
        serviceDomain: 'web-creation',
        message: 'Buy backlinks now please visit my site.',
        website: 'http://spam.example.com',
      }),
    });
    expect(honeypot.status).toBe(201);

    // Reject malformed submissionKey
    const badKey = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Rivera',
        email: 'alex@example.com',
        tier: 'startup',
        serviceDomain: 'data-analytics',
        message: 'Testing invalid submission key handling cleanly.',
        submissionKey: 'not-a-uuid',
      }),
    });
    expect(badKey.status).toBe(400);

    // Reject invalid non-empty phone number
    const badPhone = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Rivera',
        email: 'alex@example.com',
        phone: '12345',
        phoneCountry: 'PH',
        tier: 'startup',
        serviceDomain: 'data-analytics',
        message: 'Testing invalid phone validation rejection cleanly.',
      }),
    });
    expect(badPhone.status).toBe(400);

    // Accept formatted local Philippine number & normalize to E.164
    const phRes = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Marco Reyes',
        email: 'marco@example.com',
        phone: '(0917) 123-4567',
        phoneCountry: 'PH',
        company: 'Manila Ops',
        tier: 'smb',
        serviceDomain: 'technical-support',
        timeline: 'Within 30 days',
        message: 'Testing normalized Philippine phone storage in E.164 format.',
      }),
    });
    expect(phRes.status).toBe(201);
    const phJson = await phRes.json();
    expect(phJson.inquiry.phone).toBe('+639171234567');

    // Accept international +1 shared dialing code number (Canada)
    const caRes = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Claire Tremblay',
        email: 'claire@example.ca',
        phone: '+1 (416) 555-0199',
        company: 'Toronto Advisory',
        tier: 'enterprise',
        serviceDomain: 'account-management',
        timeline: 'This quarter',
        message: 'Testing normalized Canadian +1 international phone number.',
      }),
    });
    expect(caRes.status).toBe(201);
    const caJson = await caRes.json();
    expect(caJson.inquiry.phone).toBe('+14165550199');

    // Ensure public /api/content and /api/health do not expose phone numbers
    const publicContent = await (await fetch(`${baseUrl}/api/content`)).text();
    expect(publicContent).not.toContain('+639171234567');
    expect(publicContent).not.toContain('+14165550199');

    // Valid email-only submissions omit phone and yield collision-resistant IDs
    const ids = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const valid = await fetch(`${baseUrl}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Alex Rivera ${i}`,
          email: `alex${i}@example.com`,
          phone: '   ',
          company: 'Acme Ops',
          tier: 'startup',
          serviceDomain: 'data-analytics',
          timeline: 'Within 30 days',
          message: 'We need unified SLA analytics and support triage documentation.',
        }),
      });
      expect(valid.status).toBe(201);
      const json = await valid.json();
      expect(json.inquiry.id).toMatch(/^INQ-\d{4}-[0-9A-F]{8}$/);
      expect(json.inquiry.phone).toBeUndefined();
      ids.add(json.inquiry.id);
    }
    expect(ids.size).toBe(3);

    // Trigger rate limit (>10 requests from same IP)
    let hit429 = false;
    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${baseUrl}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Rate Test',
          email: 'rate@example.com',
          tier: 'smb',
          serviceDomain: 'technical-support',
          message: 'Testing inquiry submission rate limiter boundaries cleanly.',
        }),
      });
      if (res.status === 429) {
        hit429 = true;
        break;
      }
    }
    expect(hit429).toBe(true);
  });

  it('enforces admin passcode config, brute-force lockout, token auth, logout revocation, and SVG XSS rejection', async () => {
    // 1. Missing ADMIN_PASSCODE returns 503 instead of weak default
    delete process.env.ADMIN_PASSCODE;
    const unconfigured = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'PL-EXEC-2026' }),
    });
    expect(unconfigured.status).toBe(503);

    // 2. Configured passcode: reject unauthenticated dashboard access
    process.env.ADMIN_PASSCODE = 'Test-Strong-Passcode-99!';
    const noAuth = await fetch(`${baseUrl}/api/admin/dashboard`);
    expect(noAuth.status).toBe(401);

    // 3. Brute-force lockout after 5 wrong passcodes
    for (let i = 0; i < 5; i++) {
      const bad = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: `wrong-${i}` }),
      });
      expect(bad.status).toBe(401);
    }
    const locked = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'Test-Strong-Passcode-99!' }),
    });
    expect(locked.status).toBe(429);

    // 4. Fresh state: valid login, project CRUD, brand upload security, logout revocation
    resetServerStateForTests();
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'Test-Strong-Passcode-99!' }),
    });
    expect(loginRes.status).toBe(200);
    const { token } = await loginRes.json();
    expect(typeof token).toBe('string');

    // Reject SVG/script upload in /api/admin/brand
    const svgUpload = await fetch(`${baseUrl}/api/admin/brand`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        customLogoDataUrl: 'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIj48L3N2Zz4=',
      }),
    });
    expect(svgUpload.status).toBe(400);

    // Accept valid PNG upload while keeping customPortraitDataUrl locked to null
    const pngUpload = await fetch(`${baseUrl}/api/admin/brand`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        customLogoDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        customPortraitDataUrl: 'data:image/png;base64,iVBORw0KGgo=',
      }),
    });
    expect(pngUpload.status).toBe(200);
    const brandJson = await pngUpload.json();
    expect(brandJson.brand.customPortraitDataUrl).toBeNull();
    expect(brandJson.brand.customLogoDataUrl).toContain('data:image/png;base64,');

    // Admin can inspect dashboard and update saved inquiry status & notes
    const dashRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(dashRes.status).toBe(200);
    const dashJson = await dashRes.json();
    const firstInquiry = dashJson.inquiries[0];
    expect(firstInquiry?.id).toBeTruthy();

    const patchRes = await fetch(`${baseUrl}/api/admin/inquiries/${firstInquiry.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'Scheduled', notes: 'Verified inbox delivery.' }),
    });
    expect(patchRes.status).toBe(200);
    const patchJson = await patchRes.json();
    expect(patchJson.inquiry.status).toBe('Scheduled');
    expect(patchJson.inquiry.notes).toBe('Verified inbox delivery.');

    // Logout revokes token
    const logoutRes = await fetch(`${baseUrl}/api/admin/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(logoutRes.status).toBe(200);

    const afterLogout = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(afterLogout.status).toBe(401);
  });

  it('validates Gemini assistant inputs and returns clean 503 when GEMINI_API_KEY is missing', async () => {
    const badChat = await fetch(`${baseUrl}/api/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    expect(badChat.status).toBe(400);

    const noKeyChat = await fetch(`${baseUrl}/api/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'How do you organize weekly SLA reports?' }],
      }),
    });
    expect(noKeyChat.status).toBe(503);
    const chatErr = await noKeyChat.json();
    expect(chatErr.error).not.toContain('GEMINI_API_KEY');

    const shortGoal = await fetch(`${baseUrl}/api/assistant/scope`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'hi' }),
    });
    expect(shortGoal.status).toBe(400);

    const noKeyScope = await fetch(`${baseUrl}/api/assistant/scope`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: 'We need support ticket routing and KPI dashboard setup.',
      }),
    });
    expect(noKeyScope.status).toBe(503);
  });
});

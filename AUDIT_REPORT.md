# Production Audit, Security Hardening & Verification Report

**Application**: Pio Languisan (`PL` — Technology · Operations · Analytics)  
**Target Repository**: `https://github.com/YBTech7/PioOrlyLanguisan`  
**Target GitHub Pages URL**: `https://ybtech7.github.io/PioOrlyLanguisan/`  
**Workspace**: `/app/applet` (Node `v22.23.2`, npm `10.9.8`, Bun `1.4.4`, canonical lockfile: `bun.lock`)  
**Audit Date**: 2026-11-17

---

## 1. Environment & Repository Baseline Notes

- **VCS / Remote Status (`BLOCKED`)**: `.git` and an upstream Git remote were not present inside the `/app/applet` container (`git status` returned `fatal: not a git repository`). Therefore, creating an `audit-fix` Git branch, inspecting prior commit history, pushing to GitHub, and triggering/observing live GitHub Actions / GitHub Pages deployment are **NOT RUN / BLOCKED** from this environment.
- **Canonical Package Manager**: `bun.lock` is present (`package-lock.json` is absent). All dependency resolution and lockfile integrity checks (`bun audit`) operate against `bun.lock`; `.github/workflows/deploy.yml` has been authored around `oven-sh/setup-bun@v2` + `bun install --frozen-lockfile`.
- **Original Portrait Integrity (`PASS`)**: `public/assets/images/profile-original.png` (`1159 × 1356`, `1,903,101` bytes) was verified via SHA-256 checksum:
  `f8a535be5f0a47556eda1f7a46bf545333cfd35f6d3d92b9668c16808c9ccd8e`.  
  No pixel alterations, AI generation, filters, cropping, or motion transforms were applied.

---

## 2. File Inventory (Post-Remediation)

- **Configuration & Tooling**: `package.json`, `bun.lock`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `.gitignore`, `metadata.json`, `.github/workflows/deploy.yml`, `scripts/verify-dist.mjs`
- **Backend & Data**: `server.ts`, `data/store.json`
- **Frontend Entry & Styles**: `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/styles/profile-photo.css`, `src/types.ts`
- **Frontend Modules & Components**: `src/lib/apiClient.ts`, `src/data/profileData.ts`, `src/components/Header.tsx`, `src/components/HeroSection.tsx`, `src/components/ProfilePhoto.tsx`, `src/components/NetworkCanvas.tsx`, `src/components/BrandMark.tsx`, `src/components/ServicesAndSolutions.tsx`, `src/components/ProjectsAndInsights.tsx`, `src/components/ConsultationSection.tsx`, `src/components/AiAdvisorDrawer.tsx`, `src/components/AdminPortal.tsx`
- **Public Static Assets**: `public/favicon.svg`, `public/assets/images/profile-original.png`, `public/assets/images/ai_automation_workflow_1794901228479.jpg`, `public/assets/images/analytics_dashboard_visual_1794901227040.jpg`, `public/assets/images/blockchain_network_visual_1794901227232.jpg`
- **Automated Tests**: `tests/api.security.test.ts`, `tests/e2e.spec.ts`

---

## 3. Confirmed Defects, Root Causes & Remediation

| Severity | Finding | Root Cause & Location | Fix Implemented | Status |
|---|---|---|---|---|
| **Critical** | Hardcoded admin passcode disclosed in client bundle and server fallback | `ADMIN_PASSCODE="PL-EXEC-2026"` existed in `.env.example`, `server.ts`, and `src/components/AdminPortal.tsx`, shipping the executive passcode inside compiled client JS. | Removed all hardcoded passcode literals across `.env.example`, `server.ts`, and `AdminPortal.tsx`. Server now returns `503` if `ADMIN_PASSCODE` is unset and verifies submitted passcodes via `crypto.timingSafeEqual` on SHA-256 digests (`server.ts:270-274, 642-685`). `scripts/verify-dist.mjs` asserts the literal is absent from compiled JS bundles. | **Fixed & Verified** |
| **Critical** | GitHub Pages subpath & `/src/assets/` 404 image failures | `vite.config.ts` had static `base: '/'` and a custom plugin copying `src/assets` without rewriting component references (`src/data/profileData.ts` & `data/store.json` used `/src/assets/images/...`), breaking all 3 project/architecture visuals under `/PioOrlyLanguisan/`. | Moved `.jpg` visuals to `public/assets/images/`, removed `src/assets/`, configured dynamic `base` in `vite.config.ts` (`VITE_BASE_PATH` or `mode === 'gh-pages'`), added `resolveAssetUrl()` honoring `import.meta.env.BASE_URL` (`src/data/profileData.ts:18-38`), and updated `data/store.json` + `server.ts` normalization. | **Fixed & Verified** |
| **High** | Stored XSS risk via unvalidated SVG/HTML data URL uploads | `/api/admin/brand` accepted arbitrary data URLs without MIME or byte-size validation, allowing `image/svg+xml` payloads with embedded `<script>`/`onload` handlers to be persisted and rendered. | Added `validateRasterDataUrl()` in `server.ts:293-314` strictly enforcing `image/(png\|jpeg\|webp)` base64 data URLs `<= 2MB`, enforced the same check client-side in `AdminPortal.tsx:174-182`, and locked `customPortraitDataUrl: null` server-side. | **Fixed & Verified** |
| **High** | Missing brute-force lockout, rate limiting, token TTL, & logout revocation | `/api/admin/login` allowed unlimited guesses, tokens never expired or revoked, and `/api/inquiries` + `/api/assistant*` had no rate limiting. | Added 5-attempt / 15-minute IP lockout (`429` + `Retry-After`), 4-hour token TTL with pruning, `POST /api/admin/logout` revocation, inquiry rate limiting (10/15m), AI route rate limiting (20/5m), and hidden honeypot trap (`website`) in `server.ts` & `ConsultationSection.tsx`. | **Fixed & Verified** |
| **High** | Node 22 native TypeScript runtime crash & static host JSON parsing failure | `node server.ts` (`package.json` `start`) failed on extensionless `.ts` imports and static `vite` imports in production; frontend `fetch()` crashed parsing HTML 404 responses on static hosts. | Fixed `.ts` type imports, lazy-imported `vite` only when `!isProd`, added `memoryStore` read-only fallback (`server.ts:155-173`), and created `src/lib/apiClient.ts` (`apiFetch`, `VITE_API_BASE_URL`, 15s `AbortController` timeout, static `github.io` & HTML-response detection). | **Fixed & Verified** |
| **Medium** | Missing HTTP security headers, `x-powered-by`, and CORS policy | Express emitted `X-Powered-By: Express`, lacked CSP / `X-Frame-Options` / `X-Content-Type-Options`, and had no CORS allowlist for decoupled GitHub Pages -> API deployment. | Disabled `x-powered-by`, added security headers + production CSP (`server.ts:383-399`), and added `ALLOWED_ORIGINS` CORS handling (`server.ts:402-420`). | **Fixed & Verified** |
| **Medium** | Missing favicon, sticky header anchor clipping, accessibility & modal focus gaps | `<head>` had no icon (`favicon.svg` 404); `#about`/`#services`/`#solutions`/`#projects`/`#insights`/`#contact` lacked `scroll-mt-20`; mobile menu lacked `Escape`/ARIA wiring; modals lacked autofocus close buttons and skip links. | Added `public/favicon.svg` + link in `index.html`, `scroll-mt-20` on all anchored sections, skip-to-content link + `<main id="main-content">` (`App.tsx:107-121`), `Escape` + `aria-controls` in `Header.tsx`, modal close autofocus (`ProjectsAndInsights.tsx`), `aria-live="polite"` + input autofocus (`AiAdvisorDrawer.tsx`), and `document.hidden` canvas pause (`NetworkCanvas.tsx`). | **Fixed & Verified** |
| **Medium** | Eager bundling of drawers causing >500 kB Vite chunk warning & missing intrinsic portrait dimensions | `AdminPortal` and `AiAdvisorDrawer` bundled into main chunk (`539.10 kB` single chunk warning); `ProfilePhoto` lacked HTML intrinsic `width`/`height` attributes. | Added `React.lazy` + `Suspense` in `src/App.tsx`, configured `codeSplitting.groups` (`react-vendor`) in `vite.config.ts`, and added `width={1159} height={1356}` on `ProfilePhoto.tsx` (CSS unchanged). Main app entry dropped to `91.76 kB` (`21.22 kB` gzip). | **Fixed & Verified** |
| **Low** | Missing automated tests and GitHub Actions CI workflow | No Vitest suite, Playwright E2E suite, dist verification script, or `.github/workflows/deploy.yml` existed in workspace. | Added `tests/api.security.test.ts`, `tests/e2e.spec.ts`, `scripts/verify-dist.mjs`, and `.github/workflows/deploy.yml`. | **Fixed & Verified** |

---

## 4. Verification Commands & Observed Results

| Check | Command | Exit Code | Observed Result |
|---|---|---|---|
| TypeScript Check | `npx tsc --noEmit` (`lint_applet`) | `0` | Passed with 0 type errors across `src/`, `server.ts`, and `tests/`. |
| API & Security Unit Tests | `npx vitest run` | `0` | `1 passed (1)` file, `8 passed (8)` tests (`tests/api.security.test.ts`, 203ms). |
| GitHub Pages Subpath Build | `npm run build:gh-pages` (`VITE_BASE_PATH=/PioOrlyLanguisan/`) | `0` | Built in `776ms`; 5 JS chunks (largest `react-vendor`: `425.65 kB` / `129.51 kB` gzip; app `index`: `91.81 kB` / `21.24 kB` gzip). |
| GH Pages Artifact Verification | `npm run verify:gh-pages` | `0` | `[verify-dist] PASS: Verified dist/ (base="/PioOrlyLanguisan/", 5 JS bundle(s), portrait SHA-256 intact).` |
| Playwright E2E (GH Pages `/PioOrlyLanguisan/`) | `VITE_BASE_PATH=/PioOrlyLanguisan/ PLAYWRIGHT_PORT=4174 npx playwright test` | `0` | `10 passed (21.7s)` in Chromium covering assets, static portrait CSS, tabs, filters, modals, FAQ, form validation, AI/Admin fallbacks, and 7 viewports (`320px`–`1920px`). |
| Root Production Build | `npm run build` (`base="/"`) | `0` | Built in `735ms`; `[verify-dist] PASS: Verified dist/ (base="/", 5 JS bundle(s), portrait SHA-256 intact).` |
| Playwright E2E (Root `/`) | `npx playwright test` | `0` | `10 passed (21.5s)` in Chromium. |
| Dependency Security Audit | `bun audit` | `1` (advisory present) | Checked 279 packages: 0 direct/runtime vulnerabilities; 1 transitive high advisory in dev/build tooling (`picomatch@4.0.7` via `vite`/`vitest > tinyglobby > fdir > picomatch`, `GHSA-fc5q-39xc-vjpf`). `bun audit fix` confirmed no upstream patched version published within range (`Fixed 0 of 1`). |
| Live Gemini API Call | Node env check | `BLOCKED` | `GEMINI_API_KEY` and `ADMIN_PASSCODE` are unset in sandbox shell (`{ hasGeminiKey: false, hasAdminPasscode: false }`). Unconfigured `503` behavior tested via Vitest & mocked Playwright tests; live Gemini inference not executed. |

---

## 5. Security & OWASP Assessment

- **Secrets & Credential Exposure**: No API keys or passcodes exist in `src/`, `dist/`, or `.env.example`. `ADMIN_PASSCODE` and `GEMINI_API_KEY` are read exclusively server-side (`server.ts`).
- **Authentication & Access Control**: Admin routes require `Authorization: Bearer <token>`, tokens use 256-bit `crypto.randomBytes(32)`, expire after 4 hours, and support explicit revocation (`POST /api/admin/logout`).
- **Brute-Force & Abuse Controls**: Login locks out for 15 minutes after 5 failed attempts; `/api/inquiries` and `/api/assistant*` enforce per-IP rate limits with `Retry-After` headers.
- **Input Validation & XSS Prevention**: React escapes all rendered text; zero `dangerouslySetInnerHTML`; inquiry enums (`tier`, `serviceDomain`, `status`) and string bounds are validated server-side; logo uploads restrict MIME to raster `png`/`jpeg`/`webp` `<= 2MB`.
- **Note on Persistence & Rate-Limit Storage**: Rate-limit buckets, active admin tokens, and fallback store live in process memory (`data/store.json` on writable disk). Under multi-instance Cloud Run horizontal scaling, persistent data and session/rate-limit state would need a shared database/store if scaled beyond 1 instance.

---

## 6. Performance Measurements (Chromium / Local `vite preview`)

Measured directly via Playwright Chromium `PerformanceNavigationTiming`, `PerformancePaintTiming`, `largest-contentful-paint`, and `layout-shift` observers on `http://127.0.0.1:4176/` (`vite preview` serving production `/` `dist/`, mocked `/api/content` `200`, Google Fonts fetched over network). *Note: Standalone `lighthouse` CLI was not installed in the sandbox environment.*

| Viewport | DOMContentLoaded | Load | FCP | LCP | CLS | Total Transfer |
|---|---|---|---|---|---|---|
| **Desktop (`1440×900`)** | `141 ms` | `141 ms` | `404 ms` | `476 ms` | `0.0078` | `2,819,497 bytes` |
| **Mobile (`390×844`)** | `170 ms` | `170 ms` | `320 ms` | `320 ms` | `0.0278` | `2,819,497 bytes` |

- **Asset Transfer Breakdown**: `profile-original.png` accounts for `1,903,101` bytes (~67% of initial payload) because original binary preservation prohibits re-encoding or cropping. `blockchain_network_visual_1794901227232.jpg` (`756,430` bytes) is lazy-loaded when below fold. JS initial payload (`index` + `react-vendor` + `rolldown-runtime`) transfers `151,157` bytes compressed (`~151 kB`), with `AdminPortal` and `AiAdvisorDrawer` deferred on demand.

---

## 7. Remaining Blockers & Follow-Up Actions

1. **Git Push & Live GitHub Pages Verification (`BLOCKED`)**: Because `.git` is absent in the sandbox container, push these changes (including `.github/workflows/deploy.yml`) to `YBTech7/PioOrlyLanguisan`, ensure **Settings → Pages → Source** is set to **GitHub Actions**, and run the workflow to verify `https://ybtech7.github.io/PioOrlyLanguisan/`.
2. **Production Environment Secrets (`BLOCKED`)**: Configure `GEMINI_API_KEY` and a strong `ADMIN_PASSCODE` (plus `ALLOWED_ORIGINS=https://ybtech7.github.io` if hosting the backend separately from GitHub Pages) in your server runtime environment before enabling live AI Advisor and Admin Console features.
3. **Multi-Browser & Lighthouse Runs (`NOT RUN`)**: Only Playwright Chromium was installed (`firefox` and `webkit` binaries and `lighthouse` CLI were not present in the container).

---

## 8. Final Remediation Checklist

- [x] **PASS** — TypeScript check (`tsc --noEmit`) passes cleanly
- [x] **PASS** — Production build (`base="/"`) and GitHub Pages subpath build (`base="/PioOrlyLanguisan/"`) succeed and pass `scripts/verify-dist.mjs`
- [x] **PASS** — Original portrait `public/assets/images/profile-original.png` SHA-256 unchanged and static CSS rules verified in browser
- [x] **PASS** — Hardcoded passcode `PL-EXEC-2026` completely removed from `.env.example`, `server.ts`, UI, and compiled JS bundles
- [x] **PASS** — API security controls verified by automated Vitest suite (`8/8` passing)
- [x] **PASS** — Browser functional, fallback, accessibility, and responsive checks (`320px`–`1920px`) verified by Playwright Chromium (`10/10` passing on both `/` and `/PioOrlyLanguisan/`)
- [ ] **BLOCKED** — Live Gemini API inference check (`GEMINI_API_KEY` not available in container environment)
- [ ] **BLOCKED** — Git commit/push & live GitHub Pages deployment verification (no `.git` / GitHub credentials in container environment)
- [ ] **NOT RUN** — Cross-browser Firefox/WebKit E2E & standalone Lighthouse CLI scoring (binaries not installed in container)

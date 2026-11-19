import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');
const basePath = process.env.VITE_BASE_PATH || '/';
const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;

const EXPECTED_PORTRAIT_SHA256 =
  '395c1f53a5bd9f09249279a7aa5d33fad27c0cd9c014f9ebce54925a258fdbc5';

const EXPECTED_EMBLEM_SHA256 =
  '97b27240df101c59508930f5aa0a8621a716de3d31ebbb853e6e8a05c62ac312';

const REQUIRED_PUBLIC_ASSETS = [
  'favicon.svg',
  'assets/images/pl-circular-emblem.png',
  'assets/images/portrait-pio-languisan.png',
  'assets/images/ai_automation_workflow_1794901228479.jpg',
  'assets/images/analytics_dashboard_visual_1794901227040.jpg',
  'assets/images/blockchain_network_visual_1794901227232.jpg',
];

function fail(message) {
  console.error(`[verify-dist] FAIL: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  fail('dist directory does not exist. Run build first.');
}

if (!fs.existsSync(indexPath)) {
  fail('dist/index.html is missing.');
}

const html = fs.readFileSync(indexPath, 'utf-8');

if (html.includes('/src/main.tsx') || html.includes('src/main.tsx')) {
  fail('dist/index.html still references raw /src/main.tsx.');
}

if (html.includes('/src/assets/')) {
  fail('dist/index.html references unbundled /src/assets/ paths.');
}

if (normalizedBase !== '/') {
  const expectedAssetPrefix = `${normalizedBase}assets/`;
  if (!html.includes(expectedAssetPrefix)) {
    fail(
      `dist/index.html does not contain expected base-prefixed asset path "${expectedAssetPrefix}".`
    );
  }
}

for (const rel of REQUIRED_PUBLIC_ASSETS) {
  const target = path.join(distDir, rel);
  if (!fs.existsSync(target)) {
    fail(`Required static asset missing in dist/: ${rel}`);
  }
  const stat = fs.statSync(target);
  if (stat.size === 0) {
    fail(`Static asset in dist/ is empty (0 bytes): ${rel}`);
  }
}

const portraitPath = path.join(distDir, 'assets/images/portrait-pio-languisan.png');
const portraitHash = crypto
  .createHash('sha256')
  .update(fs.readFileSync(portraitPath))
  .digest('hex');

if (portraitHash !== EXPECTED_PORTRAIT_SHA256) {
  fail(
    `Portrait integrity mismatch! Expected ${EXPECTED_PORTRAIT_SHA256}, got ${portraitHash}.`
  );
}

const emblemPath = path.join(distDir, 'assets/images/pl-circular-emblem.png');
const emblemHash = crypto
  .createHash('sha256')
  .update(fs.readFileSync(emblemPath))
  .digest('hex');

if (emblemHash !== EXPECTED_EMBLEM_SHA256) {
  fail(
    `Emblem integrity mismatch! Expected ${EXPECTED_EMBLEM_SHA256}, got ${emblemHash}.`
  );
}

// Verify compiled JS bundles contain no leaked secrets or raw /src/assets references
const assetsDir = path.join(distDir, 'assets');
const assetFiles = fs.readdirSync(assetsDir);
const jsFiles = assetFiles.filter((f) => f.endsWith('.js'));
if (jsFiles.length === 0) {
  fail('No compiled JavaScript bundles found in dist/assets/.');
}

for (const jsFile of jsFiles) {
  const code = fs.readFileSync(path.join(assetsDir, jsFile), 'utf-8');
  if (code.includes('PL-EXEC-2026')) {
    fail(`Compiled bundle ${jsFile} contains removed hardcoded passcode!`);
  }
  if (code.includes('"/src/assets/') || code.includes("'/src/assets/")) {
    fail(`Compiled bundle ${jsFile} still references raw /src/assets/ path!`);
  }
}

console.log(
  `[verify-dist] PASS: Verified dist/ (base="${normalizedBase}", ${jsFiles.length} JS bundle(s), portrait SHA-256 intact).`
);

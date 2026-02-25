/**
 * Smoke Pages
 * Validates key routes and GhostRegime APIs return expected status codes.
 * Does not start the server — assume user/CI starts it.
 *
 * Usage: npm run smoke:pages -- [--base-url URL] [--timeout-ms N]
 * Example: npm run smoke:pages -- --base-url http://localhost:3000
 */

const PAGE_ROUTES = [
  '/',
  '/learn',
  '/learn/457',
  '/learn/masterclass',
  '/models',
  '/why-60-40-dead',
  '/ghostregime',
  '/ghostregime/how-it-works',
  '/ghostregime/methodology',
  '/onboarding',
  '/builder',
] as const;

const API_ROUTES = [
  '/api/ghostregime/health',
  '/api/ghostregime/today',
] as const;

/** 503 is acceptable only if JSON contains one of these codes */
const ACCEPTABLE_503_CODES = [
  'NOT_READY',
  'GHOSTREGIME_NOT_READY',
  'GHOSTREGIME_NOT_SEEDED',
];

function parseArgs(): { baseUrl: string; timeoutMs: number } {
  const args = process.argv.slice(2);
  let baseUrl = 'http://localhost:3000';
  let timeoutMs = 10000;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base-url' && args[i + 1]) {
      baseUrl = args[i + 1].replace(/\/$/, '');
      i++;
    } else if (args[i] === '--timeout-ms' && args[i + 1]) {
      timeoutMs = parseInt(args[i + 1], 10) || 10000;
      i++;
    }
  }

  return { baseUrl, timeoutMs };
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<{ status: number; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'text/html,application/json' },
    });
    const body = await res.text();
    return { status: res.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

function isAcceptable503(body: string): boolean {
  try {
    const json = JSON.parse(body);
    const error = json?.error ?? json?.status;
    const str = typeof error === 'string' ? error : '';
    return ACCEPTABLE_503_CODES.some((code) => str.includes(code));
  } catch {
    return false;
  }
}

async function checkPage(
  baseUrl: string,
  path: string,
  timeoutMs: number
): Promise<{ ok: boolean; status: number; body: string }> {
  const url = `${baseUrl}${path}`;
  const { status, body } = await fetchWithTimeout(url, timeoutMs);
  const ok = status === 200;
  return { ok, status, body };
}

async function checkApi(
  baseUrl: string,
  path: string,
  timeoutMs: number
): Promise<{ ok: boolean; status: number; body: string }> {
  const url = `${baseUrl}${path}`;
  const { status, body } = await fetchWithTimeout(url, timeoutMs);

  if (status === 200) {
    return { ok: true, status, body };
  }
  if (status === 503 && isAcceptable503(body)) {
    return { ok: true, status, body };
  }
  return { ok: false, status, body };
}

function truncate(body: string, max = 200): string {
  if (body.length <= max) return body;
  return body.slice(0, max) + '...';
}

async function main(): Promise<void> {
  const { baseUrl, timeoutMs } = parseArgs();
  const start = Date.now();
  let failed = 0;

  console.log(`Smoke pages (base: ${baseUrl}, timeout: ${timeoutMs}ms)\n`);

  for (const path of PAGE_ROUTES) {
    const { ok, status, body } = await checkPage(baseUrl, path, timeoutMs);
    if (ok) {
      console.log(`  PASS  ${path}`);
    } else {
      console.log(`  FAIL  ${path}  HTTP ${status}`);
      console.log(`        ${truncate(body).replace(/\n/g, ' ')}`);
      failed++;
    }
  }

  for (const path of API_ROUTES) {
    const { ok, status, body } = await checkApi(baseUrl, path, timeoutMs);
    if (ok) {
      console.log(`  PASS  ${path}  (${status})`);
    } else {
      console.log(`  FAIL  ${path}  HTTP ${status}`);
      console.log(`        ${truncate(body).replace(/\n/g, ' ')}`);
      failed++;
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\nDone in ${elapsed}s. ${failed > 0 ? `${failed} failed.` : 'All passed.'}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Smoke pages error:', err.message);
  process.exit(1);
});

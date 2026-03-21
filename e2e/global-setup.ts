import { type FullConfig } from '@playwright/test';
import { execFileSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Global Setup — runs once before all test suites.
 *
 * Strategy (required due to Miniflare internals):
 *   Miniflare stores D1 data in its own internal format inside SQLite — seeding
 *   via `sqlite3` directly doesn't work. `wrangler d1 execute --local` must be used,
 *   but it needs to share the same persist-to path.
 *
 *   The trick: wrangler pages dev and wrangler d1 execute hash the DB name the same
 *   way when they use the same `database_name` from wrangler.toml. We use the default
 *   [[d1_databases]] entry (sunnahskills-admin-v2) — no --env flag on either command.
 *
 * Steps:
 *   1. Wipe .wrangler/test-state
 *   2. Seed schema + data via wrangler d1 execute --command (statement by statement)
 *   3. Start wrangler pages dev in background (server uses same persist-to path)
 *   4. Wait for server to be ready
 *   5. Ensure playwright/.auth/ directory exists
 */

let serverProcess: ReturnType<typeof spawn> | null = null;

const TEST_PORT = 8789;
const BASE_URL = `http://localhost:${TEST_PORT}`;
// wrangler pages dev hashes the D1 binding name "DB" → SQLite file e7352547...
// wrangler d1 execute uses database_name from wrangler.toml as the hash input.
// We set database_name = "DB" in wrangler.toml so both tools hash to the same file.
const DB_NAME = 'DB';
const PERSIST = '--persist-to=.wrangler/test-state';

function d1(sql: string) {
  execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', DB_NAME, '--local', PERSIST, '--command', sql],
    { stdio: 'pipe' }
  );
}

function runSqlFile(filePath: string) {
  const raw = fs.readFileSync(path.resolve(filePath), 'utf8');
  // Strip line comments FIRST, then split on semicolons
  const sql = raw.replace(/--[^\n]*/g, '');
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`[global-setup] Running ${statements.length} statements from ${filePath}`);
  for (const stmt of statements) {
    d1(stmt);
  }
}

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`[global-setup] Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function globalSetup(_config: FullConfig) {
  console.log('\n[global-setup] Resetting test database...');

  // 1. Kill any lingering process on port
  try {
    execFileSync('sh', ['-c', `lsof -ti:${TEST_PORT} | xargs kill -9`], { stdio: 'pipe' });
  } catch { /* nothing running */ }

  // 2. Wipe previous test state
  const testStateDir = path.resolve('.wrangler/test-state');
  if (fs.existsSync(testStateDir)) {
    fs.rmSync(testStateDir, { recursive: true, force: true });
    console.log('[global-setup] Wiped .wrangler/test-state');
  }

  // 3. Seed schema and data via wrangler d1 execute --command
  runSqlFile('./db/schema.sql');
  console.log('[global-setup] Schema applied');

  runSqlFile('./db/seed-test.sql');
  console.log('[global-setup] Seed data applied');

  // 4. Build frontend
  console.log('[global-setup] Building frontend...');
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });

  // 5. Start wrangler pages dev in background
  console.log(`[global-setup] Starting dev server on port ${TEST_PORT}...`);

  // Read .dev.vars.test and build -b bindings
  const varsFile = path.resolve('.dev.vars.test');
  const bindings: string[] = [];
  if (fs.existsSync(varsFile)) {
    const lines = fs.readFileSync(varsFile, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (trimmed.includes('=')) bindings.push('-b', trimmed);
    }
  }

  const args = [
    'wrangler', 'pages', 'dev', 'dist',
    '--port', String(TEST_PORT),
    '--local',
    PERSIST,
    '--d1', 'DB',
    ...bindings,
  ];

  serverProcess = spawn('npx', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  serverProcess.stdout?.on('data', (d: Buffer) => {
    const line = d.toString().trim();
    if (line) process.stdout.write(`[wrangler] ${line}\n`);
  });
  serverProcess.stderr?.on('data', (d: Buffer) => {
    const line = d.toString().trim();
    if (line) process.stderr.write(`[wrangler] ${line}\n`);
  });

  // Store PID for teardown
  (globalThis as Record<string, unknown>).__wranglerPid = serverProcess.pid;

  // 6. Wait for server to be ready
  await waitForServer(BASE_URL);
  console.log(`[global-setup] Server ready at ${BASE_URL}`);

  // 7. Ensure auth output directory exists
  const authDir = path.resolve('playwright/.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log('[global-setup] Created playwright/.auth/');
  }

  console.log('[global-setup] Test DB seeded and ready\n');
}

export default globalSetup;

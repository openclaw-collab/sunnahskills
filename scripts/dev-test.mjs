#!/usr/bin/env node
/**
 * dev-test.mjs
 * Starts wrangler pages dev for the test environment.
 * Reads .dev.vars.test and passes each var as -b KEY=VALUE
 * (wrangler pages dev does not support --vars-file).
 */
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const varsFile = resolve('.dev.vars.test');
const bindings = [];

if (existsSync(varsFile)) {
  const lines = readFileSync(varsFile, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (trimmed.includes('=')) {
      bindings.push('-b', trimmed);
    }
  }
}

const args = [
  'pages', 'dev', 'dist',
  '--port', '8789',
  '--local',
  '--persist-to=.wrangler/test-state',
  '--d1', 'DB',
  ...bindings,
];

console.log('[dev-test] Starting wrangler pages dev on port 8789 (Miniflare/local SQLite)');

const proc = spawn('npx', ['wrangler', ...args], { stdio: 'inherit' });

proc.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => proc.kill('SIGINT'));
process.on('SIGTERM', () => proc.kill('SIGTERM'));

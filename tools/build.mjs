#!/usr/bin/env node
/* ==========================================================================
   build.mjs — one command to regenerate the whole site.

     1. diagrams/*.html   from tools/diagrams.mjs (+ layout/audit in
                          tools/build-diagrams.mjs)
     2. index.html        from tools/index-template.html + tools/engine.css
     3. site nav          injected into every diagram page (idempotent)

   Usage:  node tools/build.mjs [--audit]
   ========================================================================== */

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const AUDIT = process.argv.includes('--audit');

function run(label, script, args) {
  console.log(`\n── ${label} ${'─'.repeat(Math.max(0, 58 - label.length))}`);
  // No shell: node's own executable path can contain spaces on Windows.
  const result = spawnSync(process.execPath, [script, ...args], { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

run('diagrams', resolve(HERE, 'build-diagrams.mjs'), AUDIT ? ['--audit'] : []);
run('overview page', resolve(HERE, 'build-index.mjs'), []);
run('site navigation', resolve(ROOT, 'inject-nav.mjs'), []);

console.log('\nSite rebuilt. Serve the repository root to preview:  npx serve .');

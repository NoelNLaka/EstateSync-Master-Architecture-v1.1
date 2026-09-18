#!/usr/bin/env node
/* ==========================================================================
   build-index.mjs

   Injects the shared token/chrome stylesheet into tools/index-template.html so
   the overview page and the diagram pages cannot drift apart on colour, type
   or spacing. Edit the template for content; edit engine.css for styling.

   Usage:  node tools/build-index.mjs
   ========================================================================== */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const template = readFileSync(resolve(HERE, 'index-template.html'), 'utf8');
const engineCss = readFileSync(resolve(HERE, 'engine.css'), 'utf8');

const styles = `<style>
${engineCss}
</style>`;

if (!template.includes('<!--{{STYLES}}-->')) {
  throw new Error('index-template.html is missing the <!--{{STYLES}}--> placeholder');
}

const html = template.replace('<!--{{STYLES}}-->', styles);
writeFileSync(resolve(ROOT, 'index.html'), html);

console.log(`built index.html  ${(html.length / 1024).toFixed(0)} KB`);

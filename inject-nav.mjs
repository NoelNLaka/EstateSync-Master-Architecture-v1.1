// Injects a shared site nav into each generated diagram page.
// Idempotent: guarded by MARKER, so re-running after a diagram is rebuilt
// re-applies cleanly.
//
// The pages are produced by tools/build-diagrams.mjs, which deliberately does
// not know about site navigation; this file is the only place that does.
import { readFileSync, writeFileSync } from 'node:fs';

const MARKER = 'estatesync-site-nav';

const PAGES = [
  { file: 'system-context.html',           label: 'System context' },
  { file: 'runtime-architecture.html',     label: 'Runtime architecture' },
  { file: 'privileged-path.html',          label: 'Privileged path' },
  { file: 'tenant-isolation.html',         label: 'Tenant isolation' },
  { file: 'trust-boundaries.html',         label: 'Trust boundaries' },
  { file: 'security-edge.html',            label: 'Cloudflare security edge' },
  { file: 'waf-rate-limits.html',          label: 'WAF & rate limits' },
  { file: 'deployment-topology.html',      label: 'Deployment topology' },
  { file: 'zero-trust.html',               label: 'Zero Trust' },
  { file: 'control-chain.html',            label: 'Control chain' },
  { file: 'data-model.html',               label: 'Data model' },
  { file: 'maintenance-lifecycle.html',    label: 'Maintenance lifecycle' },
  { file: 'finance-dataflow.html',         label: 'Finance data flow' },
  { file: 'ci-gates.html',                 label: 'CI gates' },
  { file: 'implementation-checklist.html', label: 'Rollout checklist' },
  { file: 'plan-coverage.html',            label: 'Plan coverage (Free → Enterprise)' },
  { file: 'edge-coverage-gap.html',        label: 'Edge coverage gap' },
];

// The page toolbar is fixed at top-right, so the site nav takes top-left.
// Under 720px the toolbar un-fixes; the nav follows suit and flows above it,
// since it is injected first in the body.
const css = `
  <style id="${MARKER}-style">
    .site-nav {
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: 101;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.75rem;
    }
    .site-nav a.site-nav-home,
    .site-nav button {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.7rem;
      border-radius: 0.5rem;
      border: 1px solid var(--toolbar-border);
      background: var(--toolbar-bg);
      color: var(--toolbar-text);
      font: inherit;
      text-decoration: none;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: background 0.15s ease, color 0.15s ease;
    }
    .site-nav a.site-nav-home:hover,
    .site-nav button:hover { background: var(--toolbar-hover); color: var(--text); }
    .site-nav-chevron {
      width: 0; height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 5px solid currentColor;
      opacity: 0.7;
    }
    .site-nav-wrap { position: relative; }
    .site-nav-menu {
      position: absolute;
      top: calc(100% + 0.4rem);
      left: 0;
      min-width: 15rem;
      max-height: min(70vh, 32rem);
      overflow: auto;
      padding: 0.3rem;
      border-radius: 0.6rem;
      border: 1px solid var(--toolbar-border);
      background: var(--toolbar-menu-bg);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
      display: none;
      flex-direction: column;
      gap: 0.1rem;
    }
    .site-nav-menu[data-open="true"] { display: flex; }
    .site-nav-menu a {
      padding: 0.45rem 0.6rem;
      border-radius: 0.4rem;
      color: var(--toolbar-text);
      text-decoration: none;
      white-space: nowrap;
    }
    .site-nav-menu a:hover { background: var(--toolbar-hover); color: var(--text); }
    .site-nav-menu a[aria-current="page"] { color: var(--arrow-emphasis); }
    @media (max-width: 720px) {
      .site-nav { position: relative; top: 0; left: 0; margin-bottom: 0.75rem; }
    }
    @media print { .site-nav { display: none !important; } }
    html[data-embed="true"] .site-nav,
    html[data-present="true"] .site-nav { display: none !important; }
  </style>`;

function navMarkup(currentFile) {
  const links = PAGES.map((p) => {
    const current = p.file === currentFile ? ' aria-current="page"' : '';
    return `        <a href="./${p.file}"${current}>${p.label}</a>`;
  }).join('\n');

  return `
  <!-- Shared site nav (injected by inject-nav.mjs) -->
  <nav class="site-nav" id="${MARKER}" aria-label="Site">
    <a class="site-nav-home" href="../index.html">&#8592; Overview</a>
    <div class="site-nav-wrap">
      <button type="button" id="site-nav-btn" aria-haspopup="menu" aria-expanded="false" aria-controls="site-nav-menu">
        <span>Diagrams</span><span class="site-nav-chevron" aria-hidden="true"></span>
      </button>
      <div class="site-nav-menu" id="site-nav-menu" role="menu" aria-label="Diagrams">
${links}
      </div>
    </div>
  </nav>
  <script>
    (function () {
      var btn = document.getElementById('site-nav-btn');
      var menu = document.getElementById('site-nav-menu');
      if (!btn || !menu) return;
      function close() { menu.dataset.open = 'false'; btn.setAttribute('aria-expanded', 'false'); }
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = menu.dataset.open === 'true';
        menu.dataset.open = open ? 'false' : 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
      document.addEventListener('click', close);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    })();
  </script>`;
}

let injected = 0;
let skipped = 0;

for (const page of PAGES) {
  const path = `diagrams/${page.file}`;
  let html = readFileSync(path, 'utf8');

  if (html.includes(MARKER)) {
    console.log(`skip (already injected): ${page.file}`);
    skipped += 1;
    continue;
  }
  if (!html.includes('</head>') || !/<body[^>]*>/.test(html)) {
    throw new Error(`unexpected structure in ${page.file}`);
  }

  html = html.replace('</head>', `${css}\n</head>`);
  html = html.replace(/<body[^>]*>/, (tag) => `${tag}${navMarkup(page.file)}`);

  writeFileSync(path, html);
  console.log(`injected: ${page.file}`);
  injected += 1;
}

console.log(`\n${injected} injected, ${skipped} already up to date.`);

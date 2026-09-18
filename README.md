# EstateSync Master SaaS Architecture v1.1

A production-oriented architecture blueprint for a multi-tenant property-management SaaS.

## Purpose

This document set expands the original EstateSync architecture into a master architecture covering:

1. System / Context Architecture
2. Runtime Architecture
3. Multi-Tenant & Security Architecture
4. Data / Database Architecture
5. Property Management Domain Model
6. Finance & Payment Architecture
7. API / Integration Architecture
8. Web + Mobile Architecture
9. CI/CD + DevSecOps Architecture
10. Disaster Recovery / Operations Architecture

## Architectural principles

- PostgreSQL RLS is the authoritative tenant-isolation boundary.
- The browser/mobile clients never receive privileged service credentials.
- Every tenant-owned table carries `organization_id`.
- Authorization is enforced in the database, not only in UI filters.
- Edge Functions are used only where privileged server-side credentials or trusted orchestration are required.
- Database migrations are forward-only and tested in CI.
- Auditability is a first-class requirement.
- Financial records use append-oriented ledger practices.
- Long-running or externally dependent work should be asynchronous.
- Multi-organization membership is designed as a first-class future capability.
- External integrations are isolated behind explicit integration boundaries.

## Source baseline

This architecture is based on the original EstateSync Architecture reference and its documented Supabase/PostgreSQL/RLS design, then extends it into a broader SaaS master architecture.

## v1.1 security expansion

Cloudflare Security Edge, WAF/rate limiting, trust boundaries, Cloudflare/Supabase topology, Zero Trust and an implementation checklist have been added.

Cloudflare is the perimeter security layer. Supabase Auth establishes identity. PostgreSQL RLS remains the authoritative multi-tenant authorization boundary.

---

# Architecture site

The document set ships with a static site so the architecture can be read as an
overview and explored as diagrams.

Open `index.html` directly, or serve the repository root (`npx serve .`).

| Path | What it is |
|---|---|
| `index.html` | Overview — core statement, security edge, trust boundaries, WAF policy, topology, Zero Trust, runtime, tenancy, stack, domains, clients, delivery, rollout checklist, roadmap, AI-agent contract |
| `diagrams/system-context.html` | Actors, clients, the managed Supabase platform and external services |
| `diagrams/runtime-architecture.html` | Request path, privileged path, asynchronous fan-out |
| `diagrams/privileged-path.html` | What an Edge Function validates before it touches `service_role` |
| `diagrams/tenant-isolation.html` | The tenancy chain and the mandatory tenant-table contract |
| `diagrams/trust-boundaries.html` | TB-01 to TB-04, service-role custody, the agent boundary |
| `diagrams/security-edge.html` | Perimeter controls and the seven-way responsibility split |
| `diagrams/waf-rate-limits.html` | Surface / threat / policy matrix and the custom rule categories |
| `diagrams/deployment-topology.html` | DNS surfaces, Option A vs Option B, the mobile path |
| `diagrams/zero-trust.html` | Cloudflare Access and the protected internal resources |
| `diagrams/control-chain.html` | Seven layers and the attack class each one rejects |
| `diagrams/data-model.html` | The spine and the five domains that hang off it |
| `diagrams/maintenance-lifecycle.html` | `maintenance_requests` as a state machine |
| `diagrams/finance-dataflow.html` | Rent payments and subscription billing, meeting in one ledger |
| `diagrams/ci-gates.html` | Pull-request gates, database gates, promotion, scheduled controls |
| `diagrams/implementation-checklist.html` | The five-phase Cloudflare rollout and its gates |
| `diagrams/plan-coverage.html` | What Free covers, and what Pro / Business / Enterprise each add |
| `diagrams/edge-coverage-gap.html` | Reachability of each surface, and the Option B fix |

Every diagram page is self-contained: pan and zoom, theme switching, three
visual presets, guided views, node focus with a source reference, node search,
and PNG/SVG export all work offline with no runtime build step.

## Regenerating the site

The published pages are committed, so nothing has to be built to deploy or to
read. If you change an architecture document and want the diagrams to follow:

```bash
node tools/build.mjs            # diagrams + overview page + site nav
node tools/build.mjs --audit    # the same, plus a geometry check
```

Where the content lives:

| File | Role |
|---|---|
| `tools/diagrams.mjs` | Every node, edge, lane and guided view, each annotated with the document it came from |
| `tools/build-diagrams.mjs` | Layout, edge routing, SVG rendering, page shell and the geometry audit |
| `tools/engine.css` | Design tokens and page chrome, shared by the overview and every diagram |
| `tools/svg.css` | Node kinds, edges and the three visual presets |
| `tools/engine.js` | The diagram runtime (pan/zoom, guided views, focus, search, export) |
| `tools/index-template.html` | The overview page's content; `build-index.mjs` injects the stylesheet |
| `inject-nav.mjs` | Injects the shared site nav into each diagram page (idempotent) |

`--audit` is worth running after any content change: it fails loudly if an edge
would cross a node it does not belong to, if a caption would land on a node or
on another caption, or if a guided view names a node or edge that does not
exist. The published set currently reports zero problems.

## Deploying

Static — no build command, no output directory. Vercel serves the repository
root as-is; a push to `main` deploys, or:

```bash
vercel deploy --prod
```

## Notes on the diagram engine

Each page carries its own inlined copy of the stylesheet and runtime, so a
single `.html` file can be copied or exported without breaking. The exporter
re-uses that same stylesheet, which is why "Download SVG" reproduces what is on
screen rather than an unstyled ghost; raster output is rendered at 2× and
inherits the current theme.

Keyboard: `F` fit, `+`/`−` zoom, `G` guided views, `[`/`]` previous/next view,
`/` find a node, `T` theme, `P` preset, `Esc` clear.
Query parameters: `?theme=light|dark`, `?embed=1` (chrome hidden, for iframing),
`?present=1`.

## Source of truth

The site is read from the numbered documents in this repository
(`01-system-context.md` … `21-cloudflare-free-plan-feasibility.md`). Where the site
and those documents disagree, the documents win — and in turn they are the
engineering contract for the code, not marketing.

Doc 21 answers a question the earlier documents raise but do not settle: **can the
v1.1 security expansion run on Cloudflare's Free plan?** Roughly three-quarters of
the rollout checklist can, but three constraints decide the shape of a free
deployment — one rate-limiting rule (path-only, per-IP, 10-second window), the Free
Managed Ruleset as the only managed ruleset, and no `Log` action anywhere (so no
dry-run). The larger finding is that API coverage is not a plan question at all:
in Option A, supabase-js talks to the project hostname directly, so those surfaces
never reach the edge on any tier. Both points are diagrammed in
`plan-coverage.html` and `edge-coverage-gap.html`. Documents 14–20 each carry a
pointer to doc 21 where their own constraint bites, and doc 21 links back to all
six.

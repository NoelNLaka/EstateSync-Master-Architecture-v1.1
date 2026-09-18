# 21 — Cloudflare Free-Plan Feasibility

This document answers one question: **can the v1.1 security expansion (documents 15–20) be implemented on Cloudflare's Free plan?**

It is written against Cloudflare's plan documentation as published, and the limits quoted here change over time — the rate-limiting table and the managed-rules table are the two pages worth re-reading before committing to a rollout.

## Verdict

```text
v1.1 security expansion
   │
   ├── perimeter basics ................. Free
   │     DNS / TLS / DDoS / Free Managed Ruleset
   │
   ├── identity-layer controls ........... Free
   │     Turnstile + leaked-credential detection
   │
   ├── internal access ................... Free
   │     Cloudflare Access (≤ 50 users) + tunnels
   │
   ├── per-surface rate limits ........... Pro → Business → Enterprise
   │     Free gives exactly one rule, path-only, IP-only, 10 s window
   │
   ├── managed rulesets beyond the Free set  Pro
   │     Cloudflare Managed Ruleset + OWASP Core Ruleset
   │
   └── API surfaces behind the edge ...... Option B (any plan)
         not a plan limit — an architecture choice
```

Roughly three-quarters of the rollout checklist (doc 20) is implementable on Free. The parts that are not are *velocity and breadth* controls, not the trust boundary.

## Plan capability matrix

| Control | Free | Pro | Business | Enterprise |
|---|---|---|---|---|
| DNS, TLS, L3/4 DDoS | Yes | Yes | Yes | Yes |
| L7 HTTP DDoS managed ruleset | Yes, **1 override, no expression** | Yes | Yes | **10 overrides with expressions** |
| Managed rulesets | **Free Managed Ruleset only** | + Cloudflare Managed Ruleset, OWASP Core Ruleset | Yes | + Sensitive Data Detection |
| Custom rules | **5**, no regex, no `Log` action | 20 | 100, **regex** | 1,000 |
| WAF exceptions (skip) | Yes | Yes | Yes | Yes |
| Rate limiting rules | **1** | 2 | 5 | 100 |
| Rate-limit expression fields | **Path only** | + host, URI, query, method, source IP, UA | Yes | + body fields |
| Rate-limit counting | IP | IP | IP with NAT support | + headers, cookie, ASN, country, path, JA3/JA4, custom |
| Rate-limit window / mitigation | **10 s / 10 s** | up to 1 min / 1 h | up to 10 min / 1 day | up to 65,535 s / 1 day |
| Custom counting expression | No | No | Yes | Yes |
| Bot controls | **Bot Fight Mode** (domain-wide, not configurable) + AI bot blocking | + Super Bot Fight Mode | Yes | + Bot Management fields |
| WAF attack score | No | No | **Class only** (`cf.waf.score.class`) | **Score** (`cf.waf.score`, 1–99) |
| Leaked-credential detection | **Enabled by default** | Yes | Yes | Yes |
| Turnstile | **20 widgets, unlimited challenges**, 10 hostnames/widget | Yes | Yes | Yes (200 hostnames, custom branding, ephemeral IDs) |
| Security headers | 10 Transform Rules | 25 | 50 | 300 |
| WAF lists | 1 list, 10,000 items (IP only) | 10 lists | 10 lists | 1,000 lists, 500,000 items, hostname/ASN lists |
| Security Events retention | **24 h** (sampled, no export) | 24 h | 3 days | 30 days |
| Security Analytics retention | 7 days (24 h query window) | 7 days | 31 days | 90 days |
| Logpush / SIEM export | No | No | Yes | Yes |
| Cloudflare Access | **≤ 50 users** (tunnels included) | ≤ 50 users | ≤ 50 users | Unlimited |
| Workers | 100,000 req/day, 10 ms CPU, 50 subrequests | Paid tier ($5/mo min) | Paid tier | Paid tier |
| Durable Objects | Yes, **SQLite backend**, 100 classes, 5 GB | Yes | Yes | Yes |
| Origin Rules: host / SNI / DNS override | **No** (destination port only) | No | No | **Yes** |
| Price (per zone) | $0 | ~$20–25/mo | ~$200–250/mo | Custom |

## The three constraints that decide a free rollout

1. **One rate-limiting rule.** Not one *per surface* — one, total. Its expression can only match on **path**, counted **per IP**, over a **10-second** window, with a **10-second** mitigation. Every threshold in doc 17 (`5 / 5 min`, `120 / min`, `20 / 10 min`) is outside what Free can express, and a distributed credential-stuffing attack from many IPs is not meaningfully slowed by a 10-second per-IP counter.
2. **The Free Managed Ruleset is the only managed ruleset.** It covers high-impact, widely exploited vulnerabilities and is deployed automatically. The Cloudflare Managed Ruleset and the OWASP Core Ruleset — what doc 17 means by "managed WAF protections for common web/API attacks" — are Pro and above.
3. **No `Log` action anywhere on Free.** Custom rules support every action *except* log, so there is no dry-run: a rule either does nothing or it acts. Tuning has to come from Security Analytics (7-day retention) and Security Events (24 hours, sampled) instead of from rule logs, which means a free rollout should start conservative and widen.

## Free-tier coverage, by v1.1 document

| Document | On Free | What changes |
|---|---|---|
| 15 — Cloudflare Security Edge | Mostly | The responsibility split is unchanged; the perimeter's ruleset coverage is narrower than the document implies |
| 16 — Trust Boundaries | Unchanged | TB-01/TB-02 apply to proxied hostnames only — see the coverage gap below. TB-03 and TB-04 are unaffected |
| 17 — WAF / Rate-Limit Matrix | **Reduced** | One edge rule instead of eleven; the rest move into the application (where doc 17 already says business controls belong) |
| 18 — Deployment Topology | Unchanged | Option A/B are both available; Option B becomes more important, because it is the free way to bring API traffic behind the edge |
| 19 — Zero Trust | Yes, within the user cap | 50 users is the ceiling; the seven candidate resources are all coverable |
| 20 — Implementation Checklist | ~75% | Phase 3 and Phase 5 are fully free; Phase 2 is substantially rewritten; one Phase 4 item is blocked |

## Free-tier adaptation of the rollout

| Phase | On Free | Adaptation |
|---|---|---|
| 1 — Baseline | Yes | The Free Managed Ruleset is already on: verify it, then add exceptions. Security headers via Transform Rules |
| 2 — Abuse controls | Rewritten | Put the single rate-limit rule on the auth token path. Implement the other six surfaces as counters inside Edge Functions (a Durable Object on the free SQLite backend is precise, not approximate) |
| 3 — Turnstile | Yes, unchanged | 20 widgets, unlimited challenges, pre-clearance, server-side siteverify in an Edge Function, secret in the secret manager |
| 4 — Advanced controls | Mostly | 5 custom rules + Access for internal tools + a Worker gateway where justified. **Blocked:** authorable bot/challenge policies (Bot Fight Mode is not configurable) |
| 5 — Security tests | Yes, unchanged | And more important, because the perimeter is doing less |

Suggested use of the five custom rules, given no regex, no attack score and no bot score:

1. block known malicious sources (one IP list, 10,000 items)
2. restrict unexpected HTTP methods
3. protect the administration path
4. challenge on suspicious user-agent or path patterns
5. skip verified bots and the webhook path, so the perimeter does not break legitimate traffic

## The reachability problem — independent of plan

**In Option A, Supabase API traffic never passes through Cloudflare.** The browser and mobile clients hold the publishable key and call Supabase directly, so the edge only ever sees the Vercel-served pages. The matrix rows in doc 17 that target API and data surfaces are therefore unreachable by the edge — on Free, Pro, Business and Enterprise alike.

```text
OPTION A                              OPTION B
Browser ──▶ Cloudflare ──▶ Vercel     Browser ──▶ Cloudflare ──▶ Vercel
Browser ──────────────▶ Supabase      Browser ──▶ Cloudflare ──▶ Worker ──▶ Supabase
   (no edge control)                     (edge controls restored)
```

Doc 17's paths also do not match Supabase's actual endpoints, so the matrix needs a mapping pass before it can be implemented on any plan:

| Doc 17 surface | Where it actually lives | Behind the edge in Option A? |
|---|---|---|
| `/auth/login` | Supabase Auth `/auth/v1/token` | No — the page may be app-hosted, the credential endpoint is not |
| `/auth/signup` | Supabase Auth `/auth/v1/signup` | No |
| `/auth/reset` | Supabase Auth `/auth/v1/recover` | No |
| `/api/*` | PostgREST `/rest/v1/*` | No |
| `/properties/*` | PostgREST `/rest/v1/properties`, `/units`, `/leases` | No |
| `/documents/*` | Storage `/storage/v1/object/*` plus `agreements` rows | No |
| `/payments/*` | Payment provider, then `invoices` / `financial_ledger` writes | No |
| `/webhooks/*` | Supabase Edge Functions `/functions/v1/<name>` | No |
| `/admin/*` | Application route (Vercel) | Yes |
| `/public/*` | Application route (Vercel) | Yes |
| File upload | Storage `/storage/v1/object/*` | No |

**Option B** is the supported way to close this: a Worker gateway fetches the real project hostname (so Host and SNI are correct — something Origin Rules cannot do below Enterprise) while serving the response on your own hostname. On Free that is 100,000 requests/day, with a hard cap and no burst allowance.

Realtime is the one part not to route through a gateway: WebSocket upgrades proxied through Workers have reported failures. EstateSync does not use Realtime today (doc 11, priority 6), so this is a constraint to remember rather than a blocker — when Realtime is adopted, keep `/realtime/v1` on the direct Supabase hostname.

## Operational caveats on Free

- **No dry-run.** Without the `Log` action, a new rule acts immediately. Keep the first version narrow, then widen it using Security Analytics.
- **24 hours of Security Events, sampled.** No export, so a free-tier perimeter has no evidence trail. Anything that must be provable belongs in `audit_logs`, which is unaffected by plan.
- **Bot Fight Mode is domain-wide and not configurable**, and it cannot be selectively skipped the way a WAF rule can. If mobile clients or provider webhooks share the hostname, verify against Security Events before leaving it on; otherwise give the API its own hostname.
- **One DDoS override, no expression.** Sensitivity and action can be tuned; per-path DDoS policy cannot.
- **Workers free tier is a hard 100,000 requests/day.** A gateway is viable for an early SaaS and is the first thing that will need upgrading at scale.

## Upgrade triggers

| Trigger | Upgrade to |
|---|---|
| The Free Managed Ruleset is not enough, or a second rate-limit rule is needed | **Pro** |
| Per-surface windows longer than a minute, header/cookie counting, or attack-score classes | **Business** |
| Custom counting expressions, exact attack-score thresholds, or a clean custom hostname in front of Supabase | **Enterprise** |
| Evidence retention beyond 24 hours, or log export to a SIEM | Business (3 days) / Enterprise (30 days + Logpush) |

## What plan choice never changes

Cloudflare answers *should this traffic reach the application*. Supabase Auth answers *who is this user*. PostgreSQL RLS answers *can this user access this row* — and RLS is unaffected by the plan tier above it.

A free-tier deployment loses perimeter **breadth**, not the **boundary**: the row set is still decided inside Postgres, after the query arrives, for every request that reaches it. That is why the v1.1 addition survives on Free — the security model never depended on the edge being able to see everything.

## Related documents

- [15 — Cloudflare Security Edge Architecture](15-cloudflare-security-edge.md)
- [16 — Trust-Boundary Diagram](16-trust-boundaries.md)
- [17 — WAF / Rate-Limit Security Matrix](17-waf-rate-limit-matrix.md)
- [18 — Cloudflare / Supabase Deployment Topology](18-cloudflare-supabase-topology.md)
- [19 — Cloudflare Zero Trust / Internal Access](19-cloudflare-zero-trust.md)
- [20 — Cloudflare Implementation Checklist](20-cloudflare-implementation-checklist.md)

## Sources

Verified against Cloudflare's documentation:

- Rate limiting rules — <https://developers.cloudflare.com/waf/rate-limiting-rules/>
- Custom rules — <https://developers.cloudflare.com/waf/custom-rules/>
- Managed rules — <https://developers.cloudflare.com/waf/managed-rules/>
- WAF attack score — <https://developers.cloudflare.com/waf/detections/attack-score/>
- WAF lists — <https://developers.cloudflare.com/waf/tools/lists/>
- Turnstile plans — <https://developers.cloudflare.com/turnstile/plans/>
- Zero Trust plans — <https://www.cloudflare.com/plans/zero-trust-services/>
- Workers limits — <https://developers.cloudflare.com/workers/platform/limits/>
- Durable Objects pricing — <https://developers.cloudflare.com/durable-objects/platform/pricing/>
- Origin Rules — <https://developers.cloudflare.com/rules/origin-rules/>
- Security Analytics — <https://developers.cloudflare.com/waf/analytics/security-analytics/>
- HTTP DDoS managed ruleset — <https://developers.cloudflare.com/ddos-protection/managed-rulesets/http/>

Plan limits change. Treat every number here as a snapshot and re-verify the rate-limiting and managed-rules tables before a rollout.

# 17 — WAF / Rate-Limit Security Matrix

These are starting-point values for EstateSync and must be tuned using real traffic and false-positive data.

| Surface | Threat | Starting policy | Action |
|---|---|---:|---|
| `/auth/login` | Credential stuffing | 5 / 5 min / client | Challenge, then block |
| `/auth/signup` | Fake accounts | 5 / 10 min / client | Turnstile/challenge |
| `/auth/reset` | Reset abuse | 5 / 15 min / client | Challenge |
| `/api/*` | API abuse | 120 / min / client | 429/challenge |
| `/properties/*` | Scraping | 120 / min / client | Challenge |
| `/documents/*` | Bulk access | 60 / min / client | Challenge |
| `/payments/*` | Transaction abuse | 20 / min / client | Block/challenge |
| `/webhooks/*` | Flooding | Provider-specific | Validate + rate limit |
| `/admin/*` | Admin attack | Very restrictive | Challenge / allowlist |
| `/public/*` | Bot/spam | 60 / min / client | Challenge |
| File upload | Resource exhaustion | 20 / 10 min / client | Block/challenge |

### WAF baseline

Enable managed WAF protections for common web/API attacks and add custom rules for EstateSync-specific sensitive paths.

### Custom rule categories

1. Block known malicious sources.
2. Challenge anomalous login traffic.
3. Restrict unexpected HTTP methods.
4. Protect sensitive paths.
5. Challenge suspicious automation.
6. Protect administration surfaces.
7. Restrict webhook traffic where provider IP/signature controls permit.

Rate limiting is a perimeter control, not a precise business counter. Application authorization, idempotency and financial controls remain inside EstateSync.

### Plan and reachability constraints

This matrix is a policy target, not a plan-independent specification:

- **Plan tier.** Rule counts, counting windows and available expression fields
  differ by plan. The Free plan provides a single rate limiting rule, matched on
  path, counted per IP, over a 10-second window with a 10-second mitigation — so
  none of the thresholds above are expressible there.
- **Reachability.** The surface paths above do not map one-to-one onto Supabase
  endpoints, and in the default topology (Option A) API and data traffic does not
  pass through Cloudflare at all, so those rows have no edge control to
  configure.

Both constraints, and the adaptation they require, are covered in [21 — Cloudflare Free-Plan Feasibility](21-cloudflare-free-plan-feasibility.md).

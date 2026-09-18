# 20 — Cloudflare Implementation Checklist

### Scope on a free plan

Phases 1, 3 and 5 run unchanged on Cloudflare's Free plan. Phase 2 has to be
split between the single perimeter rate-limiting rule that Free provides and
counters inside the application. Phase 4 is partial: custom rules and Cloudflare
Access are available, bot categories and attack-score rules are not.

The phase-by-phase adaptation, with the plan matrix behind it, is in [21 — Cloudflare Free-Plan Feasibility](21-cloudflare-free-plan-feasibility.md).

## Phase 1 — Baseline

- [ ] Move authoritative DNS to Cloudflare.
- [ ] Enable HTTPS/TLS.
- [ ] Enable managed WAF baseline.
- [ ] Review Security Events.
- [ ] Configure security headers.
- [ ] Confirm Vercel/Supabase origins and domains.

## Phase 2 — Abuse controls

- [ ] Rate-limit login.
- [ ] Rate-limit signup.
- [ ] Rate-limit password reset.
- [ ] Rate-limit public forms.
- [ ] Protect document/file operations.
- [ ] Protect payment initiation.
- [ ] Protect webhooks.

## Phase 3 — Turnstile

- [ ] Separate development, staging and production widgets.
- [ ] Add Turnstile to signup.
- [ ] Add Turnstile to password reset.
- [ ] Add adaptive protection to login.
- [ ] Validate every token server-side.
- [ ] Keep the secret key server-side only.

## Phase 4 — Advanced controls

- [ ] Add custom WAF rules.
- [ ] Add bot/challenge policies.
- [ ] Protect admin paths.
- [ ] Add Cloudflare Access for internal tools.
- [ ] Add Worker gateway only where justified.
- [ ] Review false positives periodically.

## Phase 5 — Security tests

Test:

- credential stuffing
- signup automation
- API bursts
- document enumeration
- cross-tenant IDs
- malicious payloads
- forged webhooks
- unauthorized admin access

Expected control chain:

```text
Perimeter attack       → Cloudflare mitigates
Unauthenticated call   → Supabase Auth rejects
Wrong tenant row       → PostgreSQL RLS rejects
Invalid business state → DB/app constraints reject
Suspicious automation  → Challenge/block
```

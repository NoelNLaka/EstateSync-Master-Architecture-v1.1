# 11 — Architecture Gaps & Recommended Roadmap

The original EstateSync architecture is strong, but the following areas should be made explicit as the SaaS matures.

## Priority 1 — Multi-organization users

Replace single-organization inference with an explicit active-organization context.

## Priority 2 — Property-level authorization

Introduce property/resource access where business requirements require partial access.

## Priority 3 — Async jobs

Introduce a durable queue/job mechanism for:

- notifications
- PDF generation
- reports
- payment reconciliation
- scheduled reminders
- integrations

## Priority 4 — Payment architecture

Document property rent payments separately from SaaS subscription billing.

## Priority 5 — Integration framework

Standardize external adapters, webhooks, retries and idempotency.

## Priority 6 — Realtime

Use Realtime selectively for operational workflows such as maintenance queues where 30-second polling is insufficient.

## Priority 7 — CORS and configuration hardening

Avoid permissive wildcard CORS for functions that may later trust browser credentials or cookies. Fail fast on missing project configuration rather than using a hard-coded project fallback.

## Priority 8 — Architecture as source of truth

Keep these architecture documents versioned alongside:

- schema migrations
- RLS policies
- security policies
- agent/developer instructions
- CI tests

The architecture should be treated as an engineering contract rather than marketing documentation.

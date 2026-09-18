# 12 — AI Software Factory Integration Contract

EstateSync can serve as a controlled build target for an AI-assisted software factory.

## Source-of-truth hierarchy

```text
Architecture contract
       │
       ▼
Database schema + migrations
       │
       ▼
RLS / authorization policies
       │
       ▼
Application code
       │
       ▼
Automated tests
       │
       ▼
Deployment
```

## AI agent rules

An AI coding agent should:

- read the architecture before changing code
- never weaken RLS to solve a UI problem
- never expose service-role credentials
- never modify a merged migration in place
- add tenant-isolation tests for new tenant domains
- update architecture when introducing a new domain
- update security documentation when changing trust boundaries
- use least privilege
- preserve auditability

## Change workflow

```text
Request
  ↓
Architecture impact analysis
  ↓
Schema/API/security design
  ↓
Implementation
  ↓
Automated tests
  ↓
Tenant isolation tests
  ↓
Security checks
  ↓
Staging
  ↓
Approval
  ↓
Production
  ↓
Architecture update
```

This makes the architecture suitable as a guardrail document for AI-generated software rather than merely a diagram for humans.

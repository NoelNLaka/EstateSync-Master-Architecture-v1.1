# EstateSync Master Architecture v1.1 — Consolidated View

```text
┌────────────────────────────────────────────────────────────────────┐
│                         ESTATESYNC SaaS                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  WEB CLIENT                         MOBILE CLIENT                  │
│  React / Vite                       Expo                           │
│       │                                  │                         │
│       └───────────────┬──────────────────┘                         │
│                       ▼                                            │
│              Supabase Client / JWT                                │
│                       │                                            │
│             ┌─────────┴──────────┐                                 │
│             ▼                    ▼                                 │
│         PostgREST          Edge Functions                          │
│             │                    │                                 │
│             │              privileged workflows                    │
│             │                    │                                 │
│             └─────────┬──────────┘                                 │
│                       ▼                                            │
│              ┌───────────────────┐                                 │
│              │    PostgreSQL     │                                 │
│              │                   │                                 │
│              │  RLS AUTHORITY    │                                 │
│              │                   │                                 │
│              │ organizations     │                                 │
│              │ properties        │                                 │
│              │ leases            │                                 │
│              │ maintenance       │                                 │
│              │ finance           │                                 │
│              │ documents         │                                 │
│              │ audit             │                                 │
│              └─────────┬─────────┘                                 │
│                        │                                           │
│        ┌───────────────┼──────────────────┐                        │
│        ▼               ▼                  ▼                        │
│    Storage         Integrations       Realtime                     │
│                        │                                           │
│              ┌─────────┼──────────┐                                │
│              ▼         ▼          ▼                                │
│           Banking    Email       SMS                               │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ CI/CD • Security • Backups • Monitoring • Audit • Recovery         │
└────────────────────────────────────────────────────────────────────┘
```

## Core architectural statement

EstateSync is a multi-tenant, full-stack SaaS platform in which PostgreSQL is the authoritative data and authorization layer. Web and mobile clients use authenticated Supabase sessions; PostgREST exposes the database through the schema; RLS enforces tenant isolation; Edge Functions handle narrowly scoped privileged operations; integrations are isolated behind explicit boundaries; and CI/CD continuously tests database security and tenant isolation.

The architecture is designed to scale from a single organization to a multi-organization SaaS while preserving a clear security boundary and auditable business operations.

## v1.1 Security Edge

```text
Internet
   ↓
Cloudflare
   ↓
Vercel / Supabase
   ↓
Supabase Auth
   ↓
Application authorization
   ↓
PostgreSQL RLS
   ↓
Database constraints
   ↓
Audit + monitoring
```

Cloudflare is the perimeter security layer. PostgreSQL RLS remains the authoritative multi-tenant authorization boundary.

Which surfaces that perimeter can actually see, and how much of it is
configurable by plan tier, is analysed in [21 — Cloudflare Free-Plan Feasibility](21-cloudflare-free-plan-feasibility.md).

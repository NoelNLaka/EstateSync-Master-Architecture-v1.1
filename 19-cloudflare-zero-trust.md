# 19 — Cloudflare Zero Trust / Internal Access

Cloudflare can protect internal EstateSync and software-factory resources that should never be public.

```text
Developer / Admin
       │
       ▼
Cloudflare Access
       │
       ├── Identity
       ├── MFA
       ├── Device policy
       └── Access policy
              │
              ▼
       Internal resource
```

Candidate protected resources:

- staging environments
- internal admin portal
- monitoring dashboards
- deployment tools
- AI software-factory control plane
- development services
- database administration interfaces

Public customer traffic and internal administration should have separate access policies.

Zero Trust is not a replacement for PostgreSQL RLS.

Cloudflare's free Zero Trust tier covers up to 50 users, which is enough for the
candidate resources above. The wider plan picture is in [21 — Cloudflare Free-Plan Feasibility](21-cloudflare-free-plan-feasibility.md).

# 15 — Cloudflare Security Edge Architecture

Cloudflare is the perimeter/security layer. It protects public traffic before it reaches Vercel or Supabase. Supabase Auth establishes identity and PostgreSQL RLS remains the authoritative tenant-authorization boundary.

```text
INTERNET
   │
   ▼
┌──────────────────────────────┐
│ CLOUDFLARE SECURITY EDGE     │
│ DNS / TLS / DDoS / WAF       │
│ Rate limiting / Bot controls │
│ Turnstile / Security rules   │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
    Vercel           Supabase
                       │
             Auth / PostgREST
             Storage / Edge Fn
                       │
                       ▼
                  PostgreSQL
                       │
                       ▼
                      RLS
```

### Responsibility split

| Layer | Responsibility |
|---|---|
| Cloudflare | Perimeter, DDoS, WAF, rate limits, bot/challenge controls |
| Vercel | Web hosting/build/deployment |
| Supabase Auth | Identity, sessions, JWT |
| Application | Business authorization and validation |
| PostgreSQL RLS | Tenant/row authorization |
| Database | Integrity constraints |
| Audit/monitoring | Accountability and detection |

Cloudflare should answer: **"Should this traffic reach the application?"**

Supabase Auth answers: **"Who is this user?"**

PostgreSQL RLS answers: **"Can this user access this row?"**

This separation is mandatory.

How much of the perimeter is configurable depends on the plan tier, and which
surfaces the perimeter can see depends on the deployment topology — both are
analysed in [21 — Cloudflare Free-Plan Feasibility](21-cloudflare-free-plan-feasibility.md).

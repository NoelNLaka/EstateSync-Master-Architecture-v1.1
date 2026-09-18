# 18 — Cloudflare / Supabase Deployment Topology

## Recommended production topology

```text
                    DNS
                     │
                     ▼
               CLOUDFLARE
          ┌─────────────────────┐
          │ TLS / WAF / DDoS    │
          │ Rate limits / Bot   │
          │ Turnstile / Rules   │
          └─────────┬───────────┘
                    │
             ┌──────┴──────┐
             ▼             ▼
          Vercel        Supabase
             │             │
             │       ┌─────┼────────────┐
             │       │     │            │
             │      Auth PostgREST  Edge Functions
             │       │     │            │
             │       └─────┼────────────┘
             │             ▼
             │        PostgreSQL
             │             │
             └─────────────▼
                           RLS
```

### Option A — Initial architecture

```text
Browser → Cloudflare → Vercel
Browser/Mobile → Supabase client → Supabase
```

Use Cloudflare heavily for the public web application while Supabase Auth + RLS protect direct Supabase access.

### Option B — Controlled API gateway

```text
Browser → Cloudflare → Worker/API gateway → Supabase
```

Use this selectively for sensitive APIs or integrations where centralized edge controls justify the added complexity. Do not proxy every CRUD operation without a concrete requirement.

### DNS examples

```text
app.example.com       → Vercel
www.example.com       → Vercel
staging.example.com   → staging
admin.example.com     → protected administrative surface
```

Do not expose internal infrastructure merely for convenience.

### Mobile

Mobile clients use Supabase Auth and the normal Supabase client pattern. PostgreSQL RLS remains the mobile application's tenant-isolation boundary.

Option B is also what brings Supabase API traffic behind the perimeter in the
first place. The plan limits that apply to it, and the Host / SNI override a
cleaner custom-hostname proxy would need, are covered in [21 — Cloudflare Free-Plan Feasibility](21-cloudflare-free-plan-feasibility.md).

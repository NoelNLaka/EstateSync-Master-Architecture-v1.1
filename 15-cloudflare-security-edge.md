# 15 — Cloudflare Security Edge Architecture

> **Status: target architecture, not yet deployed (as of 2026-09-18).**
>
> Nothing in this repository records a completed rollout, document 20 is an
> *implementation checklist* and document 21 is a *feasibility study* — both of
> which describe work still to be done. A request to the reference
> implementation's public hostname returns `Server: Vercel` with no `cf-ray`
> header, so no Cloudflare edge is in front of it.
>
> Read the Cloudflare documents (15-21) as the design to build, not as controls
> currently protecting traffic. The distinction matters: believing a WAF is in
> front of an application that has none is worse than knowing it is unprotected,
> because it stops anyone adding one.
>
> When the document 20 checklist is completed, change this banner rather than
> deleting it, and record the date and the surfaces actually covered.

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

# 16 — Trust-Boundary Diagram

```text
┌──────────────────────────────────────────────────────────────┐
│ UNTRUSTED INTERNET                                          │
│ Browsers, bots, scanners, attackers, public clients        │
└────────────────────────────┬─────────────────────────────────┘
                             │ TB-01
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ CLOUDFLARE SECURITY ZONE                                    │
│ DNS / TLS / WAF / DDoS / rate limits / bot controls         │
└────────────────────────────┬─────────────────────────────────┘
                             │ TB-02
                ┌────────────┴────────────┐
                ▼                         ▼
┌─────────────────────────┐   ┌───────────────────────────────┐
│ VERCEL APPLICATION      │   │ SUPABASE SERVICE ZONE         │
│ React web application   │   │ Auth / PostgREST / Storage    │
│                         │   │ Edge Functions / Realtime     │
└────────────┬────────────┘   └──────────────┬────────────────┘
             └───────────────┬───────────────┘
                             │ TB-03
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ POSTGRES AUTHORIZATION ZONE                                 │
│ JWT → org membership → RLS → row access                     │
│ Authoritative multi-tenant security boundary                │
└────────────────────────────┬─────────────────────────────────┘
                             │ TB-04
                             ▼
              Banking / Email / SMS / Payment /
                    Accounting integrations
```

Service-role credentials are restricted to trusted server-side environments such as Edge Functions and never exposed to web/mobile clients.

AI coding agents are outside the production trust boundary and receive least-privilege development credentials only.

TB-01 and TB-02 only apply to traffic that reaches a proxied hostname. In the
default topology, API and data traffic goes directly to Supabase and never
crosses them; that gap is analysed in [21 — Cloudflare Free-Plan Feasibility](21-cloudflare-free-plan-feasibility.md). TB-03 is unaffected either
way — the row set is still decided inside Postgres, after the query arrives.

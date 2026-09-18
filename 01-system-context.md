# 01 — System / Context Architecture

```text
                         ┌──────────────────────────┐
                         │        Users             │
                         │ Owners / Managers / Staff │
                         │ Tenants / Contractors     │
                         └────────────┬─────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
              ┌─────▼─────┐                       ┌─────▼─────┐
              │ Web Client │                       │ Mobile App │
              │ React/Vite │                       │ Expo       │
              └─────┬─────┘                       └─────┬─────┘
                    │                                    │
                    └────────────────┬───────────────────┘
                                     │ Supabase JS
                                     ▼
                         ┌─────────────────────────┐
                         │       Supabase          │
                         │                         │
                         │ Auth / GoTrue           │
                         │ PostgREST               │
                         │ PostgreSQL + RLS        │
                         │ Storage                 │
                         │ Edge Functions          │
                         │ Realtime                │
                         └───────────┬─────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
    ┌─────▼─────┐              ┌─────▼─────┐              ┌─────▼─────┐
    │ Payments / │              │ Email/SMS │              │ Monitoring │
    │ Banking    │              │ Providers │              │ Sentry     │
    └───────────┘              └───────────┘              └───────────┘

                     ┌──────────────────────────┐
                     │ Vercel / CI/CD / GitHub │
                     └──────────────────────────┘
```

## System boundary

EstateSync owns the application logic, tenant authorization, database schema, business rules, audit trail, integration orchestration and client applications.

Managed infrastructure includes Supabase services, Vercel and selected external communication/payment providers.

## Primary actors

- Platform administrator
- Property-management organization
- Organization owner/administrator
- Property manager
- Accountant
- Maintenance/workshop staff
- Property owner
- Tenant
- Vendor/contractor

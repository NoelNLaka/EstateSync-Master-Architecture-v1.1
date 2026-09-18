# 02 — Runtime Architecture

## Request path

```text
Browser / Mobile
      │
      │ publishable key + authenticated JWT
      ▼
Supabase Auth / GoTrue
      │
      ▼
PostgREST
      │
      ▼
PostgreSQL
      │
      ├── Authentication context
      ├── RLS policies
      ├── Grants
      └── Business constraints
```

## Privileged path

```text
Client
  │
  ▼
Edge Function
  │
  ├── validate JWT
  ├── validate role
  ├── validate input
  ├── derive organization context
  └── perform privileged operation
             │
             ▼
       service_role
             │
             ▼
         PostgreSQL
```

The service role must never be exposed through `VITE_*` or `EXPO_PUBLIC_*` variables.

## Asynchronous work

Long-running work should move to an event/queue boundary:

```text
Transaction
   │
   ▼
Domain Event / Queue
   ├── email
   ├── SMS
   ├── PDF/report generation
   ├── payment reconciliation
   ├── scheduled rent reminders
   └── external webhooks
```

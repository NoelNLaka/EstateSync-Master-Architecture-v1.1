# 08 — Web + Mobile Architecture

## Web

```text
React
 ├── React Router
 ├── TanStack Query
 ├── React Hook Form
 ├── Zod
 ├── Supabase JS
 └── UI component system
```

Deployment target: Vercel or equivalent static/edge hosting.

## Mobile

```text
Expo
 ├── Expo Router
 ├── Supabase JS
 ├── persisted TanStack Query cache
 └── secure session handling
```

## Client responsibilities

Clients may handle:

- presentation
- navigation
- local state
- optimistic UX
- form validation
- non-sensitive filtering
- session state

Clients must not be trusted for:

- tenant isolation
- authorization
- financial integrity
- privileged operations
- secret storage

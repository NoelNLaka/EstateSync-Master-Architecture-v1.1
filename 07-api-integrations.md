# 07 — API & Integration Architecture

## API model

PostgREST provides schema-generated CRUD access for authorized client operations.

Edge Functions provide controlled server-side orchestration.

```text
Client
 │
 ├── CRUD / query ───────────────► PostgREST
 │
 └── privileged/action workflow ─► Edge Function
                                      │
                                      ├── external API
                                      ├── service-role DB work
                                      └── webhook handling
```

## Integration boundaries

Recommended integration adapters:

```text
integrations/
 ├── payments/
 ├── banking/
 ├── email/
 ├── sms/
 ├── accounting/
 ├── identity/
 └── document/
```

Each adapter should define:

- authentication
- request/response mapping
- retry policy
- idempotency
- timeout
- failure handling
- audit event
- webhook verification

## Webhooks

All inbound webhooks should:

1. verify authenticity
2. validate payload
3. identify the organization/context safely
4. enforce idempotency
5. record the event
6. process asynchronously where practical
7. return quickly

# 03 — Multi-Tenant & Security Architecture

## Tenant model

```text
auth.users
    │
    ├── profiles
    │
    └── org_members
           │
           ▼
     organizations
           │
           ▼
   organization_id
           │
           ▼
   Every tenant-owned table
```

## Mandatory tenant-table contract

A tenant-owned table is not complete until it has:

1. `organization_id`
2. Row Level Security enabled
3. Row Level Security forced where appropriate
4. Correct policies
5. Correct grants
6. Appropriate indexes
7. Audit behavior where required

## Defense in depth

The UI may filter by `organization_id`, but this is only a convenience fence.

The authoritative fence is PostgreSQL RLS.

A malicious request, forged client, direct REST call or UI bug must still be unable to cross organization boundaries.

## Multi-organization users

The architecture should evolve from:

```text
user → one organization
```

to:

```text
user
 ├── Organization A
 ├── Organization B
 └── Organization C
```

The active organization should be request/session scoped and explicitly selected, rather than inferred with `LIMIT 1`.

## Resource-level authorization

Where required:

```text
organization
    │
    ├── organization_members
    │
    └── property_access
            │
            ▼
         property
```

This allows a manager to access selected properties without granting access to the entire organization.

## Security controls

- MFA / step-up authentication
- Least-privilege roles
- RLS coverage tests
- Tenant-isolation tests
- Input validation with Zod or equivalent
- Server-side authorization
- Secrets kept outside client bundles
- Audit logging
- PII minimization in monitoring
- Secure headers and CORS policy
- Dependency and supply-chain scanning
- Backup and restore testing

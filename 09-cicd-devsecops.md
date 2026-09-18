# 09 — CI/CD + DevSecOps Architecture

## Pull request gates

```text
Pull Request
     │
     ├── lint
     ├── unit tests
     ├── build
     ├── migration validation
     ├── RLS coverage
     ├── tenant isolation
     ├── dependency/security checks
     └── integration tests
             │
             ▼
          Staging
             │
             ▼
        Verification
             │
             ▼
       Production
```

## Database-specific gates

### RLS coverage

Assert every tenant-owned public table has:

- RLS enabled
- required policy
- required grants
- required tenancy column

### Tenant isolation

Create test data for at least two organizations and prove:

```text
Org A session ──X──> Org B data
Org B session ──X──> Org A data
```

## Scheduled controls

- nightly backups
- restore drills
- dependency/security monitoring
- staging error monitoring
- periodic access review

## Deployment rules

- migrations are forward-only
- production migration is automated and auditable
- secrets are stored in the platform secret manager
- no database password is required in ordinary CI if token-based deployment is available
- failed deployments must be observable and reversible

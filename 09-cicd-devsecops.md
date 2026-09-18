# 09 — CI/CD + DevSecOps Architecture

> **Accuracy note (2026-09-18).** This document previously listed
> `dependency/security checks` as a pull-request gate and
> `dependency/security monitoring` as a scheduled control. Neither exists in the
> reference implementation. Secret scanning does (gitleaks and GitGuardian), and
> that is a different control: it finds credentials committed to the repository,
> not vulnerable packages. `periodic access review` was listed and does not
> exist either. Those three are now marked as **not implemented** rather than
> described in the present tense. An architecture document that claims coverage
> the system does not have is worse than one that omits it, because it stops
> anyone looking.

## Pull request gates

Implemented in the reference implementation (`NoelNLaka/property-manager`):

```text
Pull Request
     │
     ├── lint + typecheck        app-native-check, lint-scripts, lint-migrations
     ├── unit tests              functional-tests (web), app-native-check (mobile)
     ├── build                   Vercel preview; signed APK on merge
     ├── migration validation    lint-migrations (unique, forward-only versions)
     ├── RLS coverage            rls-coverage (TI-1)
     ├── tenant isolation        tenant-isolation (TI-7/TI-8)
     ├── secret scanning         secret-scan (gitleaks, full history) + GitGuardian
     ├── edge function authz     function-authz (AZ-3)
     └── workflow hardening      workflow-hardening (SC-10)
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

### Not implemented

| Gate | Status |
|---|---|
| Dependency / supply-chain scanning | **Absent.** No Dependabot, Trivy, `npm audit` gate or equivalent. Secret scanning is not a substitute. |
| Integration tests | **Partial.** Edge-function authorization is asserted statically; there is no integration suite against a seeded database. |
| Automated code review | Configured (`claude-review`) but **dormant** until an API key or OAuth token is set. |

Adding dependency scanning is small — a `dependabot.yml`, or `npm audit`
wired into the existing lint workflow. It is listed here as absent rather than
quietly dropped so the gap stays visible.

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

Implemented:

- nightly encrypted database backups (CA-6) — the compensating control for
  having no point-in-time recovery on a free-tier database
- restore drills (CA-7) — weekly, proving the backup is *recoverable* rather
  than merely produced
- security-posture monitoring (RT-2) — daily; Supabase advisors, RLS drift, and
  whether the nightly backup actually produced an artifact
- staging error monitoring — every six hours

Not implemented:

- **dependency/security monitoring** — see the gate table above
- **periodic access review** — no scheduled review of org membership, roles or
  token scopes exists

### A failure mode worth recording

Between 5 and 18 September 2026 the nightly backup failed every night. The dump
and the encryption succeeded; only the artifact upload failed, because a
GitHub Actions storage quota shared account-wide with unrelated APK builds was
full. The job's own steps looked healthy to the last one, so nothing reported
it for fourteen nights.

The lesson generalises beyond this incident: **a control whose output stops
appearing must be detected by its output, not by the exit status of the job
meant to produce it.** RT-2 now checks for the backup artifact itself.

## Deployment rules

- migrations are forward-only
- production migration is automated and auditable
- secrets are stored in the platform secret manager
- no database password is required in ordinary CI if token-based deployment is available
- failed deployments must be observable and reversible

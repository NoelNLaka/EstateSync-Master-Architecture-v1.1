# 06 — Finance & Payment Architecture

## Financial flow

```text
Lease / Service
      │
      ▼
Invoice / Charge
      │
      ▼
Payment
      │
      ▼
Reconciliation
      │
      ▼
Financial Ledger
      │
      ▼
Statements / Reports
```

## SaaS billing

```text
Organization
    │
    ▼
Subscription
    ├── Plan
    ├── Trial
    ├── Seats
    ├── Usage
    ├── Status
    └── Renewal
          │
          ▼
Payment Provider
          │
          ▼
Webhook
          │
          ▼
Billing Event
          │
          ▼
EstateSync
```

## Property rent/payment integration

The property-management payment flow should remain distinct from platform subscription billing.

```text
Tenant
  │
  ▼
Rent obligation
  │
  ├── Card
  ├── Bank transfer
  ├── Payment link
  └── Other supported method
        │
        ▼
Payment record
        │
        ▼
Reconciliation
        │
        ▼
Lease / ledger
```

## Financial controls

- Do not silently overwrite posted ledger entries.
- Preserve source transaction identifiers.
- Make reconciliation state explicit.
- Record who performed manual reconciliation.
- Maintain immutable audit evidence for material financial changes.
- Separate platform billing from landlord/tenant money flows.

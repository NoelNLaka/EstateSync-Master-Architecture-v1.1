# 04 — Data / Database Architecture

## Core spine

```text
organizations
    │
    ├── org_members
    ├── org_invitations
    ├── profiles
    └── audit_logs
```

## Portfolio domain

```text
properties
   │
   ├── units
   │      └── leases
   │             └── rent_payments
   │
   └── staff_properties
```

## Operations domain

```text
maintenance_requests
    ├── maintenance_parts
    ├── incidents
    ├── inspections
    │      └── inspection_items
    └── vendors
```

## Finance domain

```text
subscriptions
      │
billing_records
      │
invoices
      │
chart_of_accounts
      │
financial_ledger
```

## Documents and communications

```text
agreements
notification_templates
notification_logs
storage_objects
```

## Database rules

- Foreign keys enforce ownership relationships.
- Unique constraints protect business invariants.
- Check constraints validate bounded states.
- Monetary values use appropriate fixed-precision numeric types.
- Ledger entries are append-oriented.
- Deletion rules are explicit.
- Tenant indexes begin with `organization_id` where appropriate.
- Schema changes are delivered through forward-only migrations.
- Sensitive changes are auditable.

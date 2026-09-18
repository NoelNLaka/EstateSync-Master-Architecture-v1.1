# 05 — Property Management Domain Model

## Lifecycle

```text
Property
   │
   ├── Unit
   │      │
   │      └── Lease
   │             │
   │             ├── Rent schedule
   │             ├── Rent payments
   │             └── Tenant relationship
   │
   ├── Staff access
   ├── Inspections
   ├── Maintenance
   ├── Incidents
   ├── Vendors
   └── Documents
```

## Maintenance lifecycle

```text
NEW
 │
 ▼
ACKNOWLEDGED
 │
 ▼
IN_PROGRESS
 │
 ├──────────────► ON_HOLD
 │                   │
 │                   └────────► IN_PROGRESS
 │
 ▼
COMPLETED
 │
 ▼
CLOSED
```

Parts, labor, vendor costs, incidents and inspection findings should attach to the relevant maintenance/property records.

## Future property-level access

A property manager may have access to all properties in an organization, while an owner or contractor may have access only to selected properties.

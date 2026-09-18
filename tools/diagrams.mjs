/* ==========================================================================
   Diagram models.

   Every node and edge here is read from one of the numbered architecture
   documents in the repository root; the `doc` field on a node is what the
   focus card shows as its source. Layout is computed by build-diagrams.mjs —
   these models only declare lanes, nodes and relationships.

   node: { id, lane, label, sublabel?, kind, h?, w?, detail?, doc? }
   edge: { id, from, to, label?, style?: default|emphasis|security|dashed|return,
           flow?: true }
   view: { id, title, caption, nodes: [ids], edges?: [ids] }
   ========================================================================== */

export const DIAGRAMS = [
  /* ------------------------------------------------------------ 01 + 14 */
  {
    slug: 'system-context',
    navLabel: 'System context',
    kind: 'Context',
    accent: '--external-stroke',
    title: 'System context',
    lede: 'Who uses EstateSync, what the platform owns versus what it rents, and which third parties sit outside the trust boundary.',
    description: 'System context for the EstateSync multi-tenant property-management SaaS: actors, the web and mobile clients, the managed Supabase platform, and external payment, messaging and monitoring services.',
    lanes: [
      { id: 'actors', label: 'Actors', w: 200 },
      { id: 'clients', label: 'Clients', w: 200 },
      { id: 'platform', label: 'Supabase (managed)', w: 210 },
      { id: 'external', label: 'External services', w: 210 }
    ],
    regions: [
      { id: 'supabase', label: 'Supabase project — managed infrastructure', lanes: ['platform'], kind: 'region' }
    ],
    nodes: [
      { id: 'platform_admin', lane: 'actors', label: 'Platform administrator', kind: 'actor', h: 46, doc: '01-system-context.md' },
      { id: 'org', lane: 'actors', label: 'Property-management org', kind: 'actor', h: 46, doc: '01-system-context.md' },
      { id: 'owner', lane: 'actors', label: 'Owner / administrator', kind: 'actor', h: 46, doc: '01-system-context.md' },
      { id: 'manager', lane: 'actors', label: 'Property manager', kind: 'actor', h: 46, doc: '01-system-context.md', detail: 'Runs day-to-day portfolio operations inside one organization.' },
      { id: 'accountant', lane: 'actors', label: 'Accountant', kind: 'actor', h: 46, doc: '01-system-context.md' },
      { id: 'maintenance', lane: 'actors', label: 'Maintenance / workshop', kind: 'actor', h: 46, doc: '01-system-context.md' },
      { id: 'landlord', lane: 'actors', label: 'Property owner', kind: 'actor', h: 46, doc: '01-system-context.md', detail: 'A future resource-level access case: selected properties, not the whole organization.' },
      { id: 'tenant', lane: 'actors', label: 'Tenant', kind: 'actor', h: 46, doc: '01-system-context.md' },
      { id: 'vendor', lane: 'actors', label: 'Vendor / contractor', kind: 'actor', h: 46, doc: '01-system-context.md' },

      { id: 'web', lane: 'clients', label: 'Web client', sublabel: 'React · Vite · Vercel', kind: 'frontend', doc: '08-clients.md', detail: 'React Router, TanStack Query, React Hook Form and Zod over supabase-js. Ships as static/edge hosting.' },
      { id: 'mobile', lane: 'clients', label: 'Mobile app', sublabel: 'Expo · Expo Router', kind: 'frontend', doc: '08-clients.md', detail: 'Expo Router with a persisted TanStack Query cache and secure session handling.' },

      { id: 'gotrue', lane: 'platform', label: 'Auth / GoTrue', sublabel: 'JWT · MFA step-up', kind: 'cloud', doc: '13-reference-stack.md' },
      { id: 'postgrest', lane: 'platform', label: 'PostgREST', sublabel: 'schema-generated API', kind: 'backend', doc: '07-api-integrations.md' },
      { id: 'functions', lane: 'platform', label: 'Edge Functions', sublabel: 'Deno · privileged', kind: 'security', doc: '02-runtime.md', detail: 'The only server-side code, placed beside the API it extends: it exists for work that needs a credential the client cannot hold.' },
      { id: 'postgres', lane: 'platform', label: 'PostgreSQL + RLS', sublabel: 'authoritative boundary', kind: 'database', doc: '03-multitenancy-security.md', detail: 'The one component everything else defers to: data and authorization live here.' },
      { id: 'storage', lane: 'platform', label: 'Storage', sublabel: 'org-prefixed keys', kind: 'storage', doc: '04-data-model.md' },
      { id: 'realtime', lane: 'platform', label: 'Realtime', sublabel: 'selective subscriptions', kind: 'queue', h: 46, doc: '11-architecture-gaps-and-roadmap.md' },

      { id: 'payments', lane: 'external', label: 'Payments / banking', kind: 'external', doc: '06-finance-payments.md' },
      { id: 'comms', lane: 'external', label: 'Email / SMS providers', kind: 'external', doc: '07-api-integrations.md' },
      { id: 'monitoring', lane: 'external', label: 'Monitoring · Sentry', kind: 'external', doc: '10-dr-operations.md' }
    ],
    edges: [
      { id: 'manager-web', from: 'manager', to: 'web', label: 'managed access', style: 'emphasis' },
      { id: 'tenant-mobile', from: 'tenant', to: 'mobile', label: 'self-service', style: 'emphasis' },
      { id: 'web-auth', from: 'web', to: 'gotrue', label: 'anon key + JWT', style: 'emphasis' },
      { id: 'mobile-auth', from: 'mobile', to: 'gotrue', label: 'session + refresh' },
      { id: 'auth-postgrest', from: 'gotrue', to: 'postgrest', label: 'verified claims' },
      { id: 'postgrest-pg', from: 'postgrest', to: 'postgres', label: 'RLS-filtered SQL', style: 'emphasis', flow: true },
      { id: 'fns-pg', from: 'functions', to: 'postgres', label: 'service_role', style: 'security' },
      { id: 'postgrest-fns', from: 'postgrest', to: 'functions', label: 'privileged call', style: 'dashed' },
      { id: 'pg-storage', from: 'postgres', to: 'storage', label: 'row-linked objects', style: 'dashed' },
      { id: 'fns-payments', from: 'functions', to: 'payments', label: 'payment / banking', style: 'dashed' },
      { id: 'fns-comms', from: 'functions', to: 'comms', label: 'email / SMS', style: 'dashed' },
      { id: 'web-sentry', from: 'web', to: 'monitoring', label: 'errors + performance', style: 'dashed' }
    ],
    views: [
      { id: 'actors', title: 'Actors & clients', caption: 'The nine roles the platform serves, and the two clients they reach it through.', nodes: ['platform_admin', 'org', 'owner', 'manager', 'accountant', 'maintenance', 'landlord', 'tenant', 'vendor', 'web', 'mobile'] },
      { id: 'request', title: 'Request path', caption: 'Client to Postgres with the publishable key: authenticated, then RLS-filtered. No application server in between.', nodes: ['web', 'mobile', 'gotrue', 'postgrest', 'postgres'], edges: ['web-auth', 'mobile-auth', 'auth-postgrest', 'postgrest-pg'] },
      { id: 'privileged', title: 'Privileged & external', caption: 'Everything that needs a credential the browser must never hold, plus the services it calls.', nodes: ['web', 'mobile', 'postgrest', 'functions', 'postgres', 'payments', 'comms', 'monitoring'], edges: ['postgrest-fns', 'fns-pg', 'fns-payments', 'fns-comms', 'web-sentry'] }
    ],
    notes: [
      {
        title: 'System boundary',
        body: [
          'EstateSync owns the application logic, tenant authorization, database schema, business rules, audit trail, integration orchestration and the client applications.',
          'Managed infrastructure covers the Supabase services (Auth, PostgREST, PostgreSQL, Storage, Edge Functions, Realtime), the hosting platform and the selected payment, communication and monitoring providers.'
        ]
      },
      {
        callout: true,
        tag: 'Ownership line',
        body: [
          'The boundary that matters is not "our code versus their code" — it is <strong>which side holds a credential the client must never hold</strong>. Everything to the left of the Supabase region runs on a publishable key plus a user JWT; everything inside either enforces tenancy in SQL or is narrowly scoped privileged work.'
        ]
      }
    ]
  },

  /* ----------------------------------------------------------------- 02 */
  {
    slug: 'runtime-architecture',
    navLabel: 'Runtime architecture',
    kind: 'Architecture',
    accent: '--backend-stroke',
    title: 'Runtime architecture',
    lede: 'Every process in the system, every arrow between them, and the exact point where the request stops being RLS-filtered.',
    description: 'Runtime architecture: the client request path through Auth and PostgREST into PostgreSQL, the privileged edge-function path that carries service_role, and the asynchronous fan-out boundary.',
    lanes: [
      { id: 'clients', label: 'Clients', w: 190 },
      { id: 'auth', label: 'Auth & API', w: 200 },
      { id: 'data', label: 'PostgreSQL', w: 210 },
      { id: 'privileged', label: 'Privileged', w: 200 },
      { id: 'async', label: 'Async work', w: 220 }
    ],
    regions: [
      { id: 'svc', label: 'service_role — bypasses RLS', lanes: ['privileged'], kind: 'security-group' }
    ],
    nodes: [
      { id: 'web', lane: 'clients', label: 'Web SPA', sublabel: 'React · Vite', kind: 'frontend', doc: '08-clients.md' },
      { id: 'mobile', lane: 'clients', label: 'Mobile app', sublabel: 'Expo', kind: 'frontend', doc: '08-clients.md' },

      { id: 'gotrue', lane: 'auth', label: 'Auth / GoTrue', sublabel: 'JWT · refresh rotation', kind: 'cloud', doc: '13-reference-stack.md' },
      { id: 'postgrest', lane: 'auth', label: 'PostgREST', sublabel: 'schema-generated CRUD', kind: 'backend', doc: '07-api-integrations.md' },

      { id: 'fn', lane: 'privileged', label: 'Edge Functions', sublabel: 'Deno · least privilege', kind: 'security', doc: '02-runtime.md', detail: 'The only server-side code in the project. It exists because privileged work needs a credential the client cannot hold — validate JWT, validate role, validate input, derive organization context, then act.' },

      { id: 'postgres', lane: 'data', label: 'PostgreSQL', sublabel: 'RLS enabled + forced', kind: 'database', doc: '03-multitenancy-security.md', detail: 'Data and authorization in one place. The row set is decided after the query arrives, so a forged client lands on the same gate as the app.' },
      { id: 'rls', lane: 'data', label: 'RLS policies', kind: 'database', h: 44, doc: '03-multitenancy-security.md' },
      { id: 'grants', lane: 'data', label: 'Grants', kind: 'database', h: 44, doc: '03-multitenancy-security.md', detail: 'The fourth part of the tenant-table contract that people forget: perfect policies still return 42501 permission denied without them.' },
      { id: 'constraints', lane: 'data', label: 'Constraints & checks', kind: 'database', h: 44, doc: '04-data-model.md' },

      { id: 'queue', lane: 'async', label: 'Domain event / queue', sublabel: 'durable async boundary', kind: 'queue', doc: '02-runtime.md', detail: 'Long-running or externally dependent work leaves the request path here rather than making a user wait on a third party.' },
      { id: 'job-email', lane: 'async', label: 'Email', kind: 'external', h: 44, doc: '02-runtime.md' },
      { id: 'job-sms', lane: 'async', label: 'SMS', kind: 'external', h: 44, doc: '02-runtime.md' },
      { id: 'job-pdf', lane: 'async', label: 'PDF / report generation', kind: 'external', h: 44, doc: '02-runtime.md' },
      { id: 'job-reconcile', lane: 'async', label: 'Payment reconciliation', kind: 'external', h: 44, doc: '06-finance-payments.md' },
      { id: 'job-reminders', lane: 'async', label: 'Scheduled rent reminders', kind: 'external', h: 44, doc: '02-runtime.md' },
      { id: 'job-webhooks', lane: 'async', label: 'Outbound webhooks', kind: 'external', h: 44, doc: '07-api-integrations.md' }
    ],
    edges: [
      { id: 'web-auth', from: 'web', to: 'gotrue', label: 'anon key + JWT', style: 'emphasis' },
      { id: 'mobile-auth', from: 'mobile', to: 'gotrue', label: 'session + refresh' },
      { id: 'auth-postgrest', from: 'gotrue', to: 'postgrest', label: 'verified JWT' },
      { id: 'postgrest-pg', from: 'postgrest', to: 'postgres', label: 'RLS-filtered query', style: 'emphasis', flow: true },
      { id: 'web-fn', from: 'web', to: 'fn', label: 'privileged call', style: 'dashed' },
      { id: 'mobile-fn', from: 'mobile', to: 'fn', label: 'privileged call', style: 'dashed' },
      { id: 'fn-pg', from: 'fn', to: 'postgres', label: 'service_role', style: 'security' },
      { id: 'pg-rls', from: 'postgres', to: 'rls', style: 'dashed' },
      { id: 'pg-grants', from: 'postgres', to: 'grants', style: 'dashed' },
      { id: 'pg-constraints', from: 'postgres', to: 'constraints', style: 'dashed' },
      { id: 'pg-queue', from: 'postgres', to: 'queue', label: 'domain event', style: 'emphasis', flow: true },
      { id: 'q-email', from: 'queue', to: 'job-email', style: 'dashed' },
      { id: 'q-sms', from: 'queue', to: 'job-sms', style: 'dashed' },
      { id: 'q-pdf', from: 'queue', to: 'job-pdf', style: 'dashed' },
      { id: 'q-reconcile', from: 'queue', to: 'job-reconcile', style: 'dashed' },
      { id: 'q-reminders', from: 'queue', to: 'job-reminders', style: 'dashed' },
      { id: 'q-webhooks', from: 'queue', to: 'job-webhooks', style: 'dashed' }
    ],
    views: [
      { id: 'request', title: 'Request path', caption: 'Client to Postgres on the publishable key. Every arrow here is filtered by row level security.', nodes: ['web', 'mobile', 'gotrue', 'postgrest', 'postgres'], edges: ['web-auth', 'mobile-auth', 'auth-postgrest', 'postgrest-pg'] },
      { id: 'privileged', title: 'The privileged path', caption: 'The single arrow into Postgres that is not RLS-filtered — and the reason privileged work is confined to one function lane.', nodes: ['web', 'mobile', 'fn', 'postgres'], edges: ['web-fn', 'mobile-fn', 'fn-pg'] },
      { id: 'authority', title: 'Where authority lives', caption: 'Postgres is not just storage: policies, grants and constraints are part of the contract every request passes through.', nodes: ['postgrest', 'fn', 'postgres', 'rls', 'grants', 'constraints'], edges: ['postgrest-pg', 'fn-pg', 'pg-rls', 'pg-grants', 'pg-constraints'] },
      { id: 'async', title: 'Async fan-out', caption: 'Work that should not make a user wait on a third party: committed to the database, handed to a durable boundary, then fanned out.', nodes: ['postgres', 'queue', 'job-email', 'job-sms', 'job-pdf', 'job-reconcile', 'job-reminders', 'job-webhooks'], edges: ['pg-queue', 'q-email', 'q-sms', 'q-pdf', 'q-reconcile', 'q-reminders', 'q-webhooks'] }
    ],
    notes: [
      {
        title: 'The one asymmetry that matters',
        body: [
          'Both clients hold a Supabase JS client configured with the publishable <code>anon</code> key. They sign in through GoTrue and issue REST calls that PostgREST executes as the <code>authenticated</code> role.',
          'Every arrow into Postgres is RLS-filtered <strong>except</strong> the edge-function arrow, which carries <code>service_role</code>. That is why privileged work is confined to three narrow functions, and why the service key must never appear in a <code>VITE_*</code> or <code>EXPO_PUBLIC_*</code> variable.'
        ]
      },
      {
        callout: true,
        tag: 'Async boundary',
        body: [
          'Notifications, PDF and report generation, payment reconciliation, scheduled rent reminders and outbound webhooks are all long-running or externally dependent. They belong behind a queue, where a provider timeout is retried rather than shown to a user.'
        ]
      }
    ]
  },

  /* ------------------------------------------------------------- 02 + 07 */
  {
    slug: 'privileged-path',
    navLabel: 'Privileged path',
    kind: 'Sequence',
    accent: '--security-stroke',
    title: 'The privileged path',
    lede: 'What an Edge Function does before it touches service_role, and why the browser cannot shorten the trip.',
    description: 'Sequence of the privileged path: client call into an Edge Function, the five validation steps, the service_role credential held only server-side, and the direct-call paths that RLS rejects.',
    lanes: [
      { id: 'client', label: 'Client', w: 200 },
      { id: 'credential', label: 'Credential custody', w: 210 },
      { id: 'edge', label: 'Edge Function steps', w: 240 },
      { id: 'db', label: 'PostgreSQL', w: 200 }
    ],
    regions: [
      { id: 'fnbox', label: 'Edge Function — the only place service_role lives', lanes: ['edge'], kind: 'security-group' }
    ],
    nodes: [
      { id: 'browser', lane: 'client', label: 'Browser / mobile client', sublabel: 'anon key + user JWT', kind: 'frontend', doc: '02-runtime.md' },
      { id: 'forged', lane: 'client', label: 'Forged client', sublabel: 'raw REST, copied anon key', kind: 'external', h: 52, doc: '03-multitenancy-security.md' },
      { id: 'direct', lane: 'client', label: 'Direct table write', sublabel: 'skipping the function', kind: 'external', h: 52, doc: '03-multitenancy-security.md' },

      { id: 'step-jwt', lane: 'edge', label: '1 · Validate JWT', kind: 'security', h: 46, doc: '02-runtime.md' },
      { id: 'step-role', lane: 'edge', label: '2 · Validate role', kind: 'security', h: 46, doc: '03-multitenancy-security.md', detail: 'Least privilege: the caller must hold the role the operation requires, checked server-side rather than trusted from the request body.' },
      { id: 'step-input', lane: 'edge', label: '3 · Validate input', kind: 'security', h: 46, doc: '03-multitenancy-security.md', detail: 'Input validation with Zod or equivalent. Nothing reaches the privileged operation unvalidated.' },
      { id: 'step-org', lane: 'edge', label: '4 · Derive organization context', kind: 'security', h: 46, doc: '03-multitenancy-security.md', detail: 'The organization is derived from the verified identity — an output of the step, never an input the caller supplies.' },
      { id: 'step-op', lane: 'edge', label: '5 · Privileged operation', kind: 'security', h: 46, doc: '02-runtime.md' },

      { id: 'secret', lane: 'credential', label: 'Secret manager', sublabel: 'deploy-time injection', kind: 'external', doc: '09-cicd-devsecops.md' },
      { id: 'service', lane: 'credential', label: 'service_role key', sublabel: 'never in a client bundle', kind: 'security', doc: '02-runtime.md', detail: 'Realistically the single most dangerous value in the system. It bypasses RLS entirely, so its custody is the whole reason edge functions exist.' },

      { id: 'postgres', lane: 'db', label: 'PostgreSQL', sublabel: 'RLS is the default gate', kind: 'database', doc: '03-multitenancy-security.md' }
    ],
    edges: [
      { id: 'browser-step', from: 'browser', to: 'step-jwt', label: 'privileged request', style: 'emphasis', flow: true },
      { id: 'forged-step', from: 'forged', to: 'step-jwt', label: 'unsigned', style: 'dashed' },
      { id: 'direct-pg', from: 'direct', to: 'postgres', label: 'denied by RLS', style: 'security' },
      { id: 's1', from: 'step-jwt', to: 'step-role', style: 'emphasis' },
      { id: 's2', from: 'step-role', to: 'step-input', style: 'emphasis' },
      { id: 's3', from: 'step-input', to: 'step-org', style: 'emphasis' },
      { id: 's4', from: 'step-org', to: 'step-op', style: 'emphasis' },
      { id: 'secret-service', from: 'secret', to: 'service', label: 'injected at deploy', style: 'dashed' },
      { id: 'service-op', from: 'service', to: 'step-op', label: 'assumed here', style: 'dashed' },
      { id: 'op-pg', from: 'step-op', to: 'postgres', label: 'service_role', style: 'security', flow: true }
    ],
    views: [
      { id: 'steps', title: 'The call, step by step', caption: 'Five validations in order. Each one can end the call; only the last one may touch the database.', nodes: ['browser', 'step-jwt', 'step-role', 'step-input', 'step-org', 'step-op'], edges: ['browser-step', 's1', 's2', 's3', 's4'] },
      { id: 'cannot', title: 'Why the browser cannot do it', caption: 'A forged client and a direct write both reach the database — and both meet a gate the client cannot convince.', nodes: ['forged', 'direct', 'step-jwt', 'postgres'], edges: ['forged-step', 'direct-pg'] },
      { id: 'custody', title: 'Credential custody', caption: 'The service role is injected at deploy time, held server-side, and assumed for exactly one step.', nodes: ['secret', 'service', 'step-op', 'postgres'], edges: ['secret-service', 'service-op', 'op-pg'] }
    ],
    notes: [
      {
        title: 'The organization id is an output, never an input',
        body: [
          'A privileged function that accepts <code>organization_id</code> from the request body has handed the tenant boundary to the caller. The correct shape derives the organization from the verified JWT and the membership table, then writes it.',
          'That is also why a direct RPC call from the browser fails: the caller can reach the endpoint, but cannot satisfy the derived context or the role check.'
        ]
      },
      {
        title: 'Webhooks use the same discipline',
        body: [
          'Inbound webhooks verify authenticity, validate the payload, identify the organization safely, enforce idempotency, record the event, process asynchronously where practical, and return quickly.'
        ],
        ordered: [
          'verify authenticity',
          'validate payload',
          'identify organization safely',
          'enforce idempotency',
          'record the event',
          'process asynchronously',
          'return quickly'
        ]
      }
    ]
  },

  /* ----------------------------------------------------------------- 03 */
  {
    slug: 'tenant-isolation',
    navLabel: 'Tenant isolation',
    kind: 'Security',
    accent: '--security-stroke',
    title: 'Tenant isolation',
    lede: 'The load-bearing mechanism — and the reason authorization is written in SQL rather than in the UI.',
    description: 'Tenant isolation model: auth.users to profiles and org_members, the organizations table, the stored organization_id on every tenant-owned table, and the future resource-level property access path.',
    lanes: [
      { id: 'identity', label: 'Identity', w: 200 },
      { id: 'membership', label: 'Membership', w: 210 },
      { id: 'authority', label: 'Authority', w: 215 },
      { id: 'tables', label: 'Tenant-owned tables', w: 235 }
    ],
    nodes: [
      { id: 'authusers', lane: 'identity', label: 'auth.users', kind: 'database', h: 46, doc: '03-multitenancy-security.md' },
      { id: 'profiles', lane: 'identity', label: 'profiles', kind: 'database', h: 46, doc: '03-multitenancy-security.md', detail: 'A 1:1 row created by trigger on sign-up. Deliberately carries no tenancy, so editing your own profile cannot move you between organizations.' },

      { id: 'orgmembers', lane: 'membership', label: 'org_members', kind: 'database', doc: '03-multitenancy-security.md', detail: 'Where tenancy actually lives. Because membership is not on profiles, a user cannot change their own organization by editing a row they own.' },
      { id: 'invitations', lane: 'membership', label: 'org_invitations', kind: 'database', h: 46, doc: '04-data-model.md' },
      { id: 'activeorg', lane: 'membership', label: 'Active organization', sublabel: 'session-scoped · roadmap', kind: 'queue', h: 52, doc: '11-architecture-gaps-and-roadmap.md', detail: 'Priority 1 on the roadmap: replace single-organization inference with an explicitly selected active organization, so a user with several organizations is not resolved arbitrarily.' },

      { id: 'orgs', lane: 'authority', label: 'organizations', kind: 'database', doc: '04-data-model.md' },
      { id: 'orgid', lane: 'authority', label: 'organization_id', sublabel: 'stored column, not inferred', kind: 'security', doc: '03-multitenancy-security.md', detail: 'Because tenancy is a stored column rather than something derived by joining up to a landlord, one predicate covers every table — adding a domain is a migration, not an authorization redesign.' },
      { id: 'propertyaccess', lane: 'authority', label: 'property_access', sublabel: 'resource-level · roadmap', kind: 'security', h: 52, doc: '11-architecture-gaps-and-roadmap.md', detail: 'Priority 2: lets an owner or contractor hold selected properties without being granted the whole organization.' },

      { id: 'tbl-portfolio', lane: 'tables', label: 'properties · units · leases', kind: 'database', h: 46, doc: '04-data-model.md' },
      { id: 'tbl-ops', lane: 'tables', label: 'maintenance · inspections', kind: 'database', h: 46, doc: '04-data-model.md' },
      { id: 'tbl-finance', lane: 'tables', label: 'invoices · ledger · billing', kind: 'database', h: 46, doc: '04-data-model.md' },
      { id: 'tbl-docs', lane: 'tables', label: 'agreements · notifications', kind: 'database', h: 46, doc: '04-data-model.md' },
      { id: 'tbl-audit', lane: 'tables', label: 'audit_logs', kind: 'database', h: 46, doc: '10-dr-operations.md' }
    ],
    edges: [
      { id: 'users-profiles', from: 'authusers', to: 'profiles', label: '1:1 via trigger', style: 'dashed' },
      { id: 'users-members', from: 'authusers', to: 'orgmembers', style: 'emphasis' },
      { id: 'members-orgs', from: 'orgmembers', to: 'orgs', label: 'membership', style: 'emphasis' },
      { id: 'orgs-orgid', from: 'orgs', to: 'orgid', label: 'tenancy comes down', style: 'emphasis' },
      { id: 'orgid-portfolio', from: 'orgid', to: 'tbl-portfolio', label: 'one predicate', style: 'emphasis', flow: true },
      { id: 'orgid-ops', from: 'orgid', to: 'tbl-ops', style: 'emphasis' },
      { id: 'orgid-finance', from: 'orgid', to: 'tbl-finance', style: 'emphasis' },
      { id: 'orgid-docs', from: 'orgid', to: 'tbl-docs', style: 'emphasis' },
      { id: 'orgid-audit', from: 'orgid', to: 'tbl-audit', style: 'emphasis' },
      { id: 'members-active', from: 'orgmembers', to: 'activeorg', label: 'selects one', style: 'dashed' },
      { id: 'members-access', from: 'orgmembers', to: 'propertyaccess', label: 'partial access', style: 'dashed' },
      { id: 'access-portfolio', from: 'propertyaccess', to: 'tbl-portfolio', label: 'selected properties', style: 'dashed' }
    ],
    views: [
      { id: 'chain', title: 'The tenancy chain', caption: 'Identity to membership to organization. Nothing about tenancy is stored on the row a user can edit about themselves.', nodes: ['authusers', 'profiles', 'orgmembers', 'orgs'], edges: ['users-profiles', 'users-members', 'members-orgs'] },
      { id: 'predicate', title: 'One predicate, every table', caption: 'Because organization_id is a stored column, new domains inherit isolation by migration rather than by redesign.', nodes: ['orgs', 'orgid', 'tbl-portfolio', 'tbl-ops', 'tbl-finance', 'tbl-docs', 'tbl-audit'], edges: ['orgs-orgid', 'orgid-portfolio', 'orgid-ops', 'orgid-finance', 'orgid-docs', 'orgid-audit'] },
      { id: 'resource', title: 'Resource-level access', caption: 'The roadmap answer for owners and contractors who should see selected properties, not the whole organization.', nodes: ['orgmembers', 'propertyaccess', 'tbl-portfolio'], edges: ['members-access', 'access-portfolio'] },
      { id: 'audit', title: 'Audit surface', caption: 'Every tenant table has an audit counterpart; the audit log is itself tenant-owned.', nodes: ['orgid', 'tbl-audit', 'tbl-finance', 'tbl-ops'], edges: ['orgid-audit', 'orgid-finance', 'orgid-ops'] },
      { id: 'future', title: 'Single-org today, multi-org designed', caption: 'The active organization becomes an explicit, request-scoped selection instead of a single-row lookup.', nodes: ['orgmembers', 'activeorg', 'orgs'], edges: ['members-active', 'members-orgs'] }
    ],
    notes: [
      {
        title: 'The mandatory tenant-table contract',
        body: [
          'A tenant-owned table is not complete until it has all seven of these. The grants are the one people forget — their absence produces <code>42501 permission denied</code> even with perfect policies.'
        ],
        ordered: [
          '<code>organization_id</code>',
          'row level security enabled',
          'row level security forced where appropriate',
          'correct policies',
          'correct grants',
          'appropriate indexes',
          'audit behaviour where required'
        ]
      },
      {
        callout: true,
        tag: 'Defense in depth',
        body: [
          'The UI may filter by <code>organization_id</code>, but that is a convenience fence. The authoritative fence is PostgreSQL RLS: a malicious request, a forged client, a direct REST call or a UI bug must all still be unable to cross an organization boundary.',
          'Row set is decided inside Postgres <em>after</em> the query arrives, which is why a raw <code>curl</code> with the public anon key lands on the same gate as the app.'
        ]
      }
    ]
  },

  /* ----------------------------------------------------------------- 04 */
  {
    slug: 'data-model',
    navLabel: 'Data model',
    kind: 'Domain model',
    accent: '--database-stroke',
    title: 'Data model',
    lede: 'One spine, five domains. Tenancy comes down from organizations; everything else hangs off it.',
    description: 'Database architecture: the tenancy spine, the portfolio chain from properties to rent payments, the operations domain, the finance ledger and the documents and communications tables.',
    lanes: [
      { id: 'spine', label: 'Spine', w: 195 },
      { id: 'portfolio', label: 'Portfolio', w: 205 },
      { id: 'operations', label: 'Operations', w: 210 },
      { id: 'finance', label: 'Finance', w: 205 },
      { id: 'documents', label: 'Documents & comms', w: 215 }
    ],
    nodes: [
      { id: 'organizations', lane: 'spine', label: 'organizations', kind: 'database', doc: '04-data-model.md', detail: 'The root of tenancy. Every tenant-owned table carries its id, and RLS reads membership from it.' },
      { id: 'org_members', lane: 'spine', label: 'org_members', kind: 'database', h: 44, doc: '03-multitenancy-security.md' },
      { id: 'org_invitations', lane: 'spine', label: 'org_invitations', kind: 'database', h: 44, doc: '04-data-model.md' },
      { id: 'profiles', lane: 'spine', label: 'profiles', kind: 'database', h: 44, doc: '04-data-model.md' },
      { id: 'audit_logs', lane: 'spine', label: 'audit_logs', kind: 'database', h: 44, doc: '10-dr-operations.md' },

      { id: 'properties', lane: 'portfolio', label: 'properties', kind: 'database', doc: '05-property-domain.md' },
      { id: 'units', lane: 'portfolio', label: 'units', kind: 'database', h: 44, doc: '05-property-domain.md' },
      { id: 'leases', lane: 'portfolio', label: 'leases', kind: 'database', h: 44, doc: '05-property-domain.md', detail: 'Carries the rent schedule and the tenant relationship, and is what charges are raised against.' },
      { id: 'rent_payments', lane: 'portfolio', label: 'rent_payments', kind: 'database', h: 44, doc: '06-finance-payments.md' },
      { id: 'staff_properties', lane: 'portfolio', label: 'staff_properties', kind: 'database', h: 44, doc: '04-data-model.md', detail: 'The existing narrow form of resource-level access: staff to selected properties.' },

      { id: 'maintenance_requests', lane: 'operations', label: 'maintenance_requests', kind: 'database', doc: '05-property-domain.md' },
      { id: 'maintenance_parts', lane: 'operations', label: 'maintenance_parts', kind: 'database', h: 44, doc: '05-property-domain.md' },
      { id: 'incidents', lane: 'operations', label: 'incidents', kind: 'database', h: 44, doc: '05-property-domain.md' },
      { id: 'inspections', lane: 'operations', label: 'inspections', kind: 'database', h: 44, doc: '05-property-domain.md' },
      { id: 'inspection_items', lane: 'operations', label: 'inspection_items', kind: 'database', h: 44, doc: '05-property-domain.md' },
      { id: 'vendors', lane: 'operations', label: 'vendors', kind: 'database', h: 44, doc: '05-property-domain.md' },

      { id: 'subscriptions', lane: 'finance', label: 'subscriptions', kind: 'database', doc: '06-finance-payments.md' },
      { id: 'billing_records', lane: 'finance', label: 'billing_records', kind: 'database', h: 44, doc: '06-finance-payments.md' },
      { id: 'invoices', lane: 'finance', label: 'invoices', kind: 'database', h: 44, doc: '06-finance-payments.md' },
      { id: 'chart_of_accounts', lane: 'finance', label: 'chart_of_accounts', kind: 'database', h: 44, doc: '06-finance-payments.md' },
      { id: 'financial_ledger', lane: 'finance', label: 'financial_ledger', kind: 'database', h: 44, doc: '06-finance-payments.md', detail: 'Append-oriented. Posted entries are never silently overwritten, and source transaction identifiers are preserved.' },

      { id: 'agreements', lane: 'documents', label: 'agreements', kind: 'database', doc: '04-data-model.md' },
      { id: 'notification_templates', lane: 'documents', label: 'notification_templates', kind: 'database', h: 44, doc: '04-data-model.md' },
      { id: 'notification_logs', lane: 'documents', label: 'notification_logs', kind: 'database', h: 44, doc: '04-data-model.md' },
      { id: 'storage_objects', lane: 'documents', label: 'storage_objects', kind: 'storage', h: 44, doc: '04-data-model.md' }
    ],
    edges: [
      { id: 'org-properties', from: 'organizations', to: 'properties', label: 'organization_id', style: 'emphasis', flow: true },
      { id: 'org-maintenance', from: 'organizations', to: 'maintenance_requests', style: 'emphasis' },
      { id: 'org-subscriptions', from: 'organizations', to: 'subscriptions', style: 'emphasis' },
      { id: 'org-agreements', from: 'organizations', to: 'agreements', style: 'emphasis' },
      { id: 'org-profiles', from: 'organizations', to: 'profiles', style: 'dashed' },
      { id: 'org-members', from: 'organizations', to: 'org_members', style: 'dashed' },
      { id: 'org-invitations', from: 'organizations', to: 'org_invitations', style: 'dashed' },
      { id: 'org-audit', from: 'organizations', to: 'audit_logs', style: 'dashed' },

      { id: 'properties-units', from: 'properties', to: 'units', style: 'emphasis' },
      { id: 'units-leases', from: 'units', to: 'leases', style: 'emphasis' },
      { id: 'leases-rent', from: 'leases', to: 'rent_payments', label: 'rent schedule', style: 'emphasis' },
      { id: 'properties-staff', from: 'properties', to: 'staff_properties', style: 'dashed' },

      { id: 'mr-parts', from: 'maintenance_requests', to: 'maintenance_parts', style: 'emphasis' },
      { id: 'mr-incidents', from: 'maintenance_requests', to: 'incidents', style: 'dashed' },
      { id: 'mr-inspections', from: 'maintenance_requests', to: 'inspections', style: 'emphasis' },
      { id: 'insp-items', from: 'inspections', to: 'inspection_items', style: 'emphasis' },
      { id: 'mr-vendors', from: 'maintenance_requests', to: 'vendors', style: 'dashed' },

      { id: 'subs-billing', from: 'subscriptions', to: 'billing_records', style: 'emphasis' },
      { id: 'billing-invoices', from: 'billing_records', to: 'invoices', style: 'emphasis' },
      { id: 'invoices-coa', from: 'invoices', to: 'chart_of_accounts', style: 'emphasis' },
      { id: 'coa-ledger', from: 'chart_of_accounts', to: 'financial_ledger', label: 'append-oriented', style: 'emphasis' },

      { id: 'agreements-logs', from: 'agreements', to: 'notification_logs', style: 'dashed' },
      { id: 'agreements-storage', from: 'agreements', to: 'storage_objects', style: 'dashed' },
      { id: 'templates-logs', from: 'notification_templates', to: 'notification_logs', style: 'dashed' }
    ],
    views: [
      { id: 'spine', title: 'Tenancy spine', caption: 'organizations is the root; membership, invitations, profiles and the audit log hang directly off it.', nodes: ['organizations', 'org_members', 'org_invitations', 'profiles', 'audit_logs'], edges: ['org-profiles', 'org-members', 'org-invitations', 'org-audit'] },
      { id: 'portfolio', title: 'Portfolio domain', caption: 'Property → unit → lease → rent payments, with staff property access as a side table.', nodes: ['organizations', 'properties', 'units', 'leases', 'rent_payments', 'staff_properties'], edges: ['org-properties', 'properties-units', 'units-leases', 'leases-rent', 'properties-staff'] },
      { id: 'operations', title: 'Operations domain', caption: 'A maintenance request is the hub: parts, incidents, inspections and vendors all attach to it or to the property.', nodes: ['organizations', 'maintenance_requests', 'maintenance_parts', 'incidents', 'inspections', 'inspection_items', 'vendors'], edges: ['org-maintenance', 'mr-parts', 'mr-incidents', 'mr-inspections', 'insp-items', 'mr-vendors'] },
      { id: 'finance', title: 'Finance domain', caption: 'Subscription to ledger. Ledger entries are append-oriented and keep their source identifiers.', nodes: ['organizations', 'subscriptions', 'billing_records', 'invoices', 'chart_of_accounts', 'financial_ledger'], edges: ['org-subscriptions', 'subs-billing', 'billing-invoices', 'invoices-coa', 'coa-ledger'] },
      { id: 'documents', title: 'Documents & communications', caption: 'Agreements, templates, delivery logs and the storage objects they reference.', nodes: ['organizations', 'agreements', 'notification_templates', 'notification_logs', 'storage_objects'], edges: ['org-agreements', 'agreements-logs', 'agreements-storage', 'templates-logs'] }
    ],
    notes: [
      {
        title: 'Database rules',
        body: [
          'Foreign keys enforce ownership relationships, unique constraints protect business invariants, and check constraints validate bounded states. Deletion rules are explicit rather than implied.',
          'Monetary values use fixed-precision numeric types; ledger entries are append-oriented; tenant indexes begin with <code>organization_id</code> where appropriate.'
        ]
      },
      {
        callout: true,
        tag: 'Delivery rule',
        body: [
          'Schema changes arrive as forward-only migrations and are auditable. A merged migration is never edited in place — CI records applied versions, so a re-used timestamp prefix is silently skipped.'
        ]
      }
    ]
  },

  /* ----------------------------------------------------------------- 05 */
  {
    slug: 'maintenance-lifecycle',
    navLabel: 'Maintenance lifecycle',
    kind: 'State machine',
    accent: '--cloud-stroke',
    title: 'Maintenance lifecycle',
    lede: 'A maintenance request as a state machine: what advances it, what pauses it, and what closes it for good.',
    description: 'Maintenance request lifecycle state machine: NEW, ACKNOWLEDGED, IN_PROGRESS, ON_HOLD, COMPLETED and CLOSED, with the parts, costs, incidents and inspection findings that attach to a live request.',
    lanes: [
      { id: 'intake', label: 'Intake', w: 200 },
      { id: 'active', label: 'Active work', w: 200 },
      { id: 'attached', label: 'Attached records', w: 230 },
      { id: 'paused', label: 'Paused', w: 190 },
      { id: 'terminal', label: 'Terminal', w: 190 }
    ],
    nodes: [
      { id: 'new', lane: 'intake', label: 'NEW', sublabel: 'raised by tenant or staff', kind: 'frontend', doc: '05-property-domain.md' },
      { id: 'ack', lane: 'intake', label: 'ACKNOWLEDGED', sublabel: 'triaged, owned', kind: 'frontend', doc: '05-property-domain.md' },

      { id: 'progress', lane: 'active', label: 'IN_PROGRESS', sublabel: 'work is happening', kind: 'backend', doc: '05-property-domain.md', detail: 'The only state that accepts new attached records: parts, labour, vendor costs, incidents and inspection findings.' },
      { id: 'completed', lane: 'active', label: 'COMPLETED', sublabel: 'work reported done', kind: 'backend', doc: '05-property-domain.md' },

      { id: 'hold', lane: 'paused', label: 'ON_HOLD', sublabel: 'blocked, not abandoned', kind: 'security', doc: '05-property-domain.md', detail: 'A pause, not an exit. The only transition out is back to IN_PROGRESS.' },

      { id: 'closed', lane: 'terminal', label: 'CLOSED', sublabel: 'verified and archived', kind: 'database', doc: '05-property-domain.md', detail: 'Terminal. Nothing transitions out of CLOSED — a recurrence is a new request.' },

      { id: 'parts', lane: 'attached', label: 'maintenance_parts', kind: 'external', h: 46, doc: '05-property-domain.md' },
      { id: 'labour', lane: 'attached', label: 'Labour & vendor costs', kind: 'external', h: 46, doc: '05-property-domain.md' },
      { id: 'incidents', lane: 'attached', label: 'incidents', kind: 'external', h: 46, doc: '05-property-domain.md' },
      { id: 'findings', lane: 'attached', label: 'Inspection findings', kind: 'external', h: 46, doc: '05-property-domain.md' },
      { id: 'vendors', lane: 'attached', label: 'vendors', kind: 'external', h: 46, doc: '05-property-domain.md' }
    ],
    edges: [
      { id: 'new-ack', from: 'new', to: 'ack', label: 'triaged', style: 'emphasis', flow: true },
      { id: 'ack-progress', from: 'ack', to: 'progress', label: 'assigned', style: 'emphasis', flow: true },
      { id: 'progress-hold', from: 'progress', to: 'hold', label: 'blocked', style: 'dashed' },
      { id: 'hold-progress', from: 'hold', to: 'progress', label: 'resumed', style: 'return' },
      { id: 'progress-completed', from: 'progress', to: 'completed', label: 'work done', style: 'emphasis', flow: true },
      { id: 'completed-closed', from: 'completed', to: 'closed', label: 'verified', style: 'emphasis', flow: true },
      { id: 'parts-progress', from: 'parts', to: 'progress', label: 'parts attach', style: 'dashed' },
      { id: 'labour-progress', from: 'labour', to: 'progress', label: 'costs attach', style: 'dashed' },
      { id: 'incidents-progress', from: 'incidents', to: 'progress', style: 'dashed' },
      { id: 'findings-progress', from: 'findings', to: 'progress', style: 'dashed' },
    ],
    views: [
      { id: 'happy', title: 'Happy path', caption: 'Intake to terminal, with no detour: raised, acknowledged, worked, completed, closed.', nodes: ['new', 'ack', 'progress', 'completed', 'closed'], edges: ['new-ack', 'ack-progress', 'progress-completed', 'completed-closed'] },
      { id: 'pause', title: 'Pause and resume', caption: 'ON_HOLD is a detour, not an exit — the only way out is back into active work.', nodes: ['progress', 'hold'], edges: ['progress-hold', 'hold-progress'] },
      { id: 'attached', title: 'What attaches to live work', caption: 'Parts, labour, vendor costs, incidents and inspection findings all attach to the request while it is in progress.', nodes: ['progress', 'parts', 'labour', 'incidents', 'findings', 'vendors'], edges: ['parts-progress', 'labour-progress', 'incidents-progress', 'findings-progress'] }
    ],
    notes: [
      {
        title: 'What the state machine is protecting',
        body: [
          'Each state exists to answer a different question. <strong>NEW</strong> and <strong>ACKNOWLEDGED</strong> answer "does anyone own this?"; <strong>IN_PROGRESS</strong> answers "is work happening?"; <strong>ON_HOLD</strong> answers "is it blocked, and by what?"; <strong>COMPLETED</strong> answers "is the work reported done?"; <strong>CLOSED</strong> answers "has it been verified?"',
          'Collapsing any two of those hides information an operations team actually needs — which is why the pause state is distinct from the terminal one.'
        ]
      },
      {
        callout: true,
        tag: 'Attachment rule',
        body: [
          'Parts, labour, vendor costs, incidents and inspection findings attach to the relevant maintenance or property records — not to a free-text note. That is what makes cost reporting per property possible later.'
        ]
      }
    ]
  },

  /* ----------------------------------------------------------------- 06 */
  {
    slug: 'finance-dataflow',
    navLabel: 'Finance data flow',
    kind: 'Data flow',
    accent: '--cloud-stroke',
    title: 'Finance data flow',
    lede: 'Two money flows that must stay distinguishable, meeting in one append-oriented ledger.',
    description: 'Finance and payment data flow: the property rent path from lease and charge through payment and reconciliation, the separate SaaS subscription billing path with its provider webhook, and the append-oriented financial ledger that both end in.',
    lanes: [
      { id: 'obligations', label: 'Obligations', w: 215 },
      { id: 'movement', label: 'Money movement', w: 215 },
      { id: 'providers', label: 'Providers', w: 210 },
      { id: 'records', label: 'Records & ledger', w: 225 },
      { id: 'reporting', label: 'Reporting', w: 200 }
    ],
    regions: [
      { id: 'webhookbox', label: 'Verified, idempotent, recorded', lanes: ['providers'], kind: 'security-group' }
    ],
    nodes: [
      { id: 'lease', lane: 'obligations', label: 'Lease / service', sublabel: 'source of charges', kind: 'database', doc: '06-finance-payments.md' },
      { id: 'subscription', lane: 'obligations', label: 'Organization subscription', sublabel: 'plan · trial · seats · usage · renewal', kind: 'cloud', doc: '06-finance-payments.md', detail: 'Platform billing is a different money flow from landlord and tenant funds. Keeping them in separate records is what stops subscription revenue and rent from contaminating each other in reporting.' },
      { id: 'rentobligation', lane: 'obligations', label: 'Tenant rent obligation', kind: 'database', doc: '06-finance-payments.md' },

      { id: 'invoice', lane: 'movement', label: 'Invoice / charge', kind: 'backend', doc: '06-finance-payments.md' },
      { id: 'methods', lane: 'movement', label: 'Card · transfer · link', kind: 'backend', h: 52, doc: '06-finance-payments.md' },
      { id: 'billingcharge', lane: 'movement', label: 'Subscription charge', kind: 'backend', doc: '06-finance-payments.md' },

      { id: 'provider', lane: 'providers', label: 'Payment provider', kind: 'external', doc: '06-finance-payments.md' },
      { id: 'webhook', lane: 'providers', label: 'Inbound webhook', sublabel: 'verified · idempotent', kind: 'security', doc: '07-api-integrations.md', detail: 'Verify authenticity, validate the payload, identify the organization safely, enforce idempotency, record the event, process asynchronously, return quickly.' },

      { id: 'payment', lane: 'records', label: 'Payment record', sublabel: 'source transaction id kept', kind: 'backend', doc: '06-finance-payments.md' },
      { id: 'reconciliation', lane: 'records', label: 'Reconciliation', sublabel: 'explicit state · named actor', kind: 'database', doc: '06-finance-payments.md', detail: 'Reconciliation state is explicit and the person who performed a manual reconciliation is recorded.' },
      { id: 'ledger', lane: 'records', label: 'Financial ledger', sublabel: 'append-oriented', kind: 'database', doc: '06-finance-payments.md' },
      { id: 'billingevent', lane: 'records', label: 'Billing event', kind: 'cloud', doc: '06-finance-payments.md' },

      { id: 'statements', lane: 'reporting', label: 'Statements / reports', kind: 'external', doc: '06-finance-payments.md' },
      { id: 'audit', lane: 'reporting', label: 'Immutable audit evidence', sublabel: 'material financial changes', kind: 'security', h: 52, doc: '10-dr-operations.md' }
    ],
    edges: [
      { id: 'lease-invoice', from: 'lease', to: 'invoice', label: 'generates charge', style: 'emphasis', flow: true },
      { id: 'rent-methods', from: 'rentobligation', to: 'methods', label: 'pays', style: 'emphasis', flow: true },
      { id: 'subs-charge', from: 'subscription', to: 'billingcharge', label: 'seat state', style: 'emphasis' },
      { id: 'invoice-payment', from: 'invoice', to: 'payment', label: 'settled as', style: 'emphasis', flow: true },
      { id: 'methods-provider', from: 'methods', to: 'provider', label: 'collects' },
      { id: 'charge-provider', from: 'billingcharge', to: 'provider', label: 'billed by' },
      { id: 'provider-webhook', from: 'provider', to: 'webhook', label: 'async callback', style: 'dashed' },
      { id: 'webhook-payment', from: 'webhook', to: 'payment', label: 'confirmation', style: 'dashed' },
      { id: 'webhook-billing', from: 'webhook', to: 'billingevent', label: 'subscription event' },
      { id: 'payment-recon', from: 'payment', to: 'reconciliation', label: 'matched', style: 'emphasis', flow: true },
      { id: 'recon-ledger', from: 'reconciliation', to: 'ledger', label: 'posted', style: 'emphasis', flow: true },
      { id: 'ledger-statements', from: 'ledger', to: 'statements', label: 'reported', style: 'emphasis' },
      { id: 'recon-audit', from: 'reconciliation', to: 'audit', label: 'who, when, what', style: 'dashed' },
      { id: 'ledger-audit', from: 'ledger', to: 'audit', style: 'dashed' }
    ],
    views: [
      { id: 'rent', title: 'Rent and payment flow', caption: 'Tenant funds: obligation to method, provider, confirmed payment, reconciliation and ledger.', nodes: ['lease', 'rentobligation', 'invoice', 'methods', 'provider', 'webhook', 'payment', 'reconciliation', 'ledger'], edges: ['lease-invoice', 'rent-methods', 'invoice-payment', 'methods-provider', 'provider-webhook', 'webhook-payment', 'payment-recon', 'recon-ledger'] },
      { id: 'saas', title: 'Subscription billing', caption: 'Platform revenue is a separate flow: plan state billed by a provider, recorded as a billing event — never mixed into rent.', nodes: ['subscription', 'billingcharge', 'provider', 'webhook', 'billingevent'], edges: ['subs-charge', 'charge-provider', 'provider-webhook', 'webhook-billing'] },
      { id: 'controls', title: 'Ledger controls', caption: 'Posted entries are not silently overwritten, reconciliation state is explicit, and material changes leave immutable evidence.', nodes: ['payment', 'reconciliation', 'ledger', 'statements', 'audit'], edges: ['payment-recon', 'recon-ledger', 'ledger-statements', 'recon-audit', 'ledger-audit'] }
    ],
    notes: [
      {
        title: 'Financial controls',
        body: [
          'Posted ledger entries are never silently overwritten; source transaction identifiers are preserved; reconciliation state is explicit; whoever performed a manual reconciliation is recorded; material financial changes keep immutable audit evidence.'
        ],
        ordered: [
          'no silent overwrite of posted entries',
          'preserve source transaction identifiers',
          'make reconciliation state explicit',
          'record who performed manual reconciliation',
          'keep immutable audit evidence for material changes',
          'keep platform billing separate from landlord / tenant money'
        ]
      },
      {
        callout: true,
        tag: 'Two flows, one ledger shape',
        body: [
          'Property rent and platform subscription billing both end in financial records, but they are different flows with different counterparties. Merging them early makes revenue reporting ambiguous later.'
        ]
      }
    ]
  },

  /* ----------------------------------------------------------------- 09 */
  {
    slug: 'ci-gates',
    navLabel: 'CI gates',
    kind: 'Pipeline',
    accent: '--backend-stroke',
    title: 'CI gates',
    lede: 'From pull request to production: the gates that test the code, the gates that test the database, and what runs on a schedule instead.',
    description: 'CI/CD and DevSecOps pipeline: pull-request gates, the database-specific RLS coverage and tenant isolation gates, promotion from staging through verification to production, and the scheduled backup, restore-drill and monitoring controls.',
    lanes: [
      { id: 'trigger', label: 'Trigger', w: 190 },
      { id: 'gates', label: 'Pull-request gates', w: 215 },
      { id: 'dbgates', label: 'Database gates', w: 230 },
      { id: 'envs', label: 'Environments', w: 195 },
      { id: 'scheduled', label: 'Scheduled controls', w: 235 }
    ],
    regions: [
      { id: 'dbbox', label: 'Database-specific gates — RLS, not application code', lanes: ['dbgates'], kind: 'security-group' }
    ],
    nodes: [
      { id: 'pr', lane: 'trigger', label: 'Pull request', kind: 'actor', doc: '09-cicd-devsecops.md' },
      { id: 'merge', lane: 'trigger', label: 'Merge to main', kind: 'actor', h: 46, doc: '09-cicd-devsecops.md' },

      { id: 'lint', lane: 'gates', label: 'Lint', kind: 'frontend', h: 44, doc: '09-cicd-devsecops.md' },
      { id: 'unit', lane: 'gates', label: 'Unit tests', kind: 'frontend', h: 44, doc: '09-cicd-devsecops.md' },
      { id: 'build', lane: 'gates', label: 'Build', kind: 'frontend', h: 44, doc: '09-cicd-devsecops.md' },
      { id: 'migration', lane: 'gates', label: 'Migration validation', kind: 'backend', h: 44, doc: '09-cicd-devsecops.md' },
      { id: 'deps', lane: 'gates', label: 'Dependency & security scan', kind: 'security', h: 44, doc: '03-multitenancy-security.md' },
      { id: 'integration', lane: 'gates', label: 'Integration tests', kind: 'backend', h: 44, doc: '09-cicd-devsecops.md' },

      { id: 'rls', lane: 'dbgates', label: 'RLS coverage', sublabel: 'enabled · policy · grants · column', kind: 'security', h: 56, doc: '09-cicd-devsecops.md', detail: 'Asserts every tenant-owned public table has RLS enabled, a required policy, the required grants and the tenancy column. It tests the database, not the application code.' },
      { id: 'isolation', lane: 'dbgates', label: 'Tenant isolation', sublabel: 'Org A ⇏ Org B, and back', kind: 'security', h: 56, doc: '09-cicd-devsecops.md', detail: 'Plants rows for two organizations and proves under RLS that neither can read the other, then rolls the transaction back. Authenticates with an access token, so no database password lives in CI.' },
      { id: 'grants', lane: 'dbgates', label: 'Grants & tenancy column', sublabel: 'the 42501 class of bug', kind: 'security', h: 56, doc: '03-multitenancy-security.md' },

      { id: 'staging', lane: 'envs', label: 'Staging', kind: 'cloud', doc: '09-cicd-devsecops.md' },
      { id: 'verification', lane: 'envs', label: 'Verification', kind: 'cloud', h: 46, doc: '09-cicd-devsecops.md' },
      { id: 'production', lane: 'envs', label: 'Production', kind: 'database', doc: '09-cicd-devsecops.md' },

      { id: 'backup', lane: 'scheduled', label: 'Nightly backup', kind: 'external', h: 44, doc: '10-dr-operations.md' },
      { id: 'drill', lane: 'scheduled', label: 'Restore drill', kind: 'external', h: 44, doc: '10-dr-operations.md', detail: 'A backup that has never been restored is a hypothesis. The drill is what turns it into a recovery capability.' },
      { id: 'posture', lane: 'scheduled', label: 'Security posture monitor', kind: 'external', h: 44, doc: '10-dr-operations.md' },
      { id: 'errors', lane: 'scheduled', label: 'Staging error monitor', kind: 'external', h: 44, doc: '10-dr-operations.md' },
      { id: 'access', lane: 'scheduled', label: 'Periodic access review', kind: 'external', h: 44, doc: '10-dr-operations.md' }
    ],
    edges: [
      { id: 'pr-lint', from: 'pr', to: 'lint', style: 'dashed' },
      { id: 'pr-unit', from: 'pr', to: 'unit', style: 'dashed' },
      { id: 'pr-build', from: 'pr', to: 'build', style: 'dashed' },
      { id: 'pr-migration', from: 'pr', to: 'migration', label: 'schema first', style: 'emphasis', flow: true },
      { id: 'pr-deps', from: 'pr', to: 'deps', style: 'dashed' },
      { id: 'pr-integration', from: 'pr', to: 'integration', style: 'dashed' },
      { id: 'pr-rls', from: 'pr', to: 'rls', style: 'emphasis', flow: true },
      { id: 'pr-isolation', from: 'pr', to: 'isolation', style: 'emphasis', flow: true },
      { id: 'pr-grants', from: 'pr', to: 'grants', style: 'dashed' },

      { id: 'lint-staging', from: 'lint', to: 'staging' },
      { id: 'unit-staging', from: 'unit', to: 'staging' },
      { id: 'build-staging', from: 'build', to: 'staging' },
      { id: 'migration-staging', from: 'migration', to: 'staging' },
      { id: 'deps-staging', from: 'deps', to: 'staging' },
      { id: 'integration-staging', from: 'integration', to: 'staging' },
      { id: 'rls-staging', from: 'rls', to: 'staging', style: 'emphasis' },
      { id: 'isolation-staging', from: 'isolation', to: 'staging', style: 'emphasis' },
      { id: 'grants-staging', from: 'grants', to: 'staging' },

      { id: 'staging-verification', from: 'staging', to: 'verification', style: 'emphasis', flow: true },
      { id: 'verification-production', from: 'verification', to: 'production', style: 'emphasis', flow: true },
      { id: 'merge-staging', from: 'merge', to: 'staging', label: 'path-filtered deploy', style: 'dashed' },
      { id: 'merge-production', from: 'merge', to: 'production', label: 'automated, auditable', style: 'emphasis' },

      { id: 'prod-backup', from: 'production', to: 'backup', label: 'nightly', style: 'dashed' },
      { id: 'prod-drill', from: 'production', to: 'drill', label: 'restore test', style: 'dashed' },
      { id: 'prod-posture', from: 'production', to: 'posture', style: 'dashed' },
      { id: 'prod-errors', from: 'production', to: 'errors', style: 'dashed' },
      { id: 'prod-access', from: 'production', to: 'access', style: 'dashed' }
    ],
    views: [
      { id: 'gates', title: 'Required pull-request gates', caption: 'Nothing merges until lint, tests, build, migration validation, security scanning and integration tests pass.', nodes: ['pr', 'lint', 'unit', 'build', 'migration', 'deps', 'integration'], edges: ['pr-lint', 'pr-unit', 'pr-build', 'pr-migration', 'pr-deps', 'pr-integration'] },
      { id: 'database', title: 'The gates that test the database', caption: 'RLS coverage and tenant isolation are not code tests. They interrogate the schema and prove the boundary holds.', nodes: ['pr', 'rls', 'isolation', 'grants', 'staging'], edges: ['pr-rls', 'pr-isolation', 'pr-grants', 'rls-staging', 'isolation-staging', 'grants-staging'] },
      { id: 'promotion', title: 'Promotion path', caption: 'Staging is verified before production, and the production migration is automated and auditable.', nodes: ['merge', 'staging', 'verification', 'production'], edges: ['merge-staging', 'staging-verification', 'verification-production', 'merge-production'] },
      { id: 'scheduled', title: 'Scheduled controls', caption: 'Outside the pull-request path: backup, restore drill, posture monitoring, error monitoring and access review all run on a schedule.', nodes: ['production', 'backup', 'drill', 'posture', 'errors', 'access'], edges: ['prod-backup', 'prod-drill', 'prod-posture', 'prod-errors', 'prod-access'] }
    ],
    notes: [
      {
        title: 'Why database gates are separate',
        body: [
          'A green unit-test suite says nothing about whether every public table is RLS-enabled or whether one organization can read another\u2019s rows. Those are properties of the schema, so they are asserted against the schema.',
          '<code>tenant-isolation</code> plants rows for two organizations, queries as each, proves neither can see the other, and rolls the transaction back — so it is safe to run on every pull request.'
        ]
      },
      {
        callout: true,
        tag: 'Deployment rules',
        body: [
          'Migrations are forward-only. Production migration is automated and auditable. Secrets live in the platform secret manager, and token-based deployment means ordinary CI needs no database password. A failed deployment must be observable and reversible.'
        ]
      }
    ]
  },

  /* ------------------------------------------------------------ 15 */
  {
    slug: 'security-edge',
    navLabel: 'Security edge',
    kind: 'Perimeter',
    accent: '--security-stroke',
    title: 'Cloudflare security edge',
    lede: 'Cloudflare decides whether traffic should reach the application. Supabase Auth decides who the user is. RLS decides which rows they may touch.',
    description: 'Cloudflare Security Edge architecture: the perimeter controls in front of the Vercel and Supabase origins, followed by identity, application authorization, row level security and accountability.',
    lanes: [
      { id: 'internet', label: 'Untrusted internet', w: 190 },
      { id: 'perimeter', label: 'Perimeter · should this reach the app?', w: 228 },
      { id: 'origins', label: 'Origins', w: 205 },
      { id: 'authority', label: 'Who? → allowed? → consistent?', w: 228 },
      { id: 'accountability', label: 'Accountability', w: 205 }
    ],
    regions: [
      { id: 'cfzone', label: 'Cloudflare Security Edge — perimeter, not authorization', lanes: ['perimeter'], kind: 'security-group' }
    ],
    nodes: [
      { id: 'internet', lane: 'internet', label: 'Untrusted internet', kind: 'external', doc: '15-cloudflare-security-edge.md' },
      { id: 'bots', lane: 'internet', label: 'Bots · scanners · attackers', kind: 'external', h: 46, doc: '16-trust-boundaries.md' },

      { id: 'dns', lane: 'perimeter', label: 'DNS', kind: 'cloud', h: 44, doc: '18-cloudflare-supabase-topology.md' },
      { id: 'tls', lane: 'perimeter', label: 'TLS', kind: 'cloud', h: 44, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'ddos', lane: 'perimeter', label: 'DDoS protection', kind: 'security', h: 44, doc: '15-cloudflare-security-edge.md' },
      { id: 'waf', lane: 'perimeter', label: 'WAF', kind: 'security', h: 44, doc: '17-waf-rate-limit-matrix.md', detail: 'Managed WAF protections for common web and API attacks, plus custom rules for EstateSync-specific sensitive paths.' },
      { id: 'ratelimit', lane: 'perimeter', label: 'Rate limiting', kind: 'security', h: 44, doc: '17-waf-rate-limit-matrix.md', detail: 'A perimeter control, not a precise business counter. Application authorization, idempotency and financial controls remain inside EstateSync.' },
      { id: 'botctl', lane: 'perimeter', label: 'Bot controls', kind: 'security', h: 44, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'turnstile', lane: 'perimeter', label: 'Turnstile', kind: 'security', h: 44, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'rules', lane: 'perimeter', label: 'Security rules', kind: 'security', h: 44, doc: '17-waf-rate-limit-matrix.md' },

      { id: 'vercel', lane: 'origins', label: 'Vercel', sublabel: 'hosting · build · deployment', kind: 'frontend', doc: '15-cloudflare-security-edge.md' },
      { id: 'supabase', lane: 'origins', label: 'Supabase project', sublabel: 'PostgREST · Storage · Edge Functions', kind: 'cloud', doc: '18-cloudflare-supabase-topology.md' },

      { id: 'gotrue', lane: 'authority', label: 'Supabase Auth', sublabel: 'identity · sessions · JWT', kind: 'cloud', doc: '15-cloudflare-security-edge.md', detail: 'Answers “who is this user?” — and nothing else. Establishing identity is not the same as being allowed to see a row.' },
      { id: 'appauth', lane: 'authority', label: 'Application authorization', sublabel: 'business rules · validation', kind: 'backend', doc: '15-cloudflare-security-edge.md' },
      { id: 'rls', lane: 'authority', label: 'PostgreSQL RLS', sublabel: 'authoritative tenant + row boundary', kind: 'database', doc: '03-multitenancy-security.md', detail: 'Answers “can this user access this row?” — the authoritative multi-tenant security boundary.' },
      { id: 'constraints', lane: 'authority', label: 'Database constraints', sublabel: 'integrity invariants', kind: 'database', doc: '04-data-model.md' },

      { id: 'audit', lane: 'accountability', label: 'Audit & monitoring', sublabel: 'accountability · detection', kind: 'external', doc: '10-dr-operations.md' }
    ],
    edges: [
      { id: 'internet-dns', from: 'internet', to: 'dns', label: 'public traffic', style: 'emphasis', flow: true },
      { id: 'bots-ddos', from: 'bots', to: 'ddos', label: 'volumetric', style: 'dashed' },
      { id: 'bots-botctl', from: 'bots', to: 'botctl', label: 'automation', style: 'dashed' },
      { id: 'waf-vercel', from: 'waf', to: 'vercel', label: 'filtered traffic', style: 'emphasis' },
      { id: 'ratelimit-supabase', from: 'ratelimit', to: 'supabase', label: 'throttled', style: 'dashed' },
      { id: 'vercel-auth', from: 'vercel', to: 'gotrue', label: 'sign-in · session', style: 'emphasis' },
      { id: 'auth-appauth', from: 'gotrue', to: 'appauth', label: 'verified JWT', style: 'emphasis' },
      { id: 'appauth-rls', from: 'appauth', to: 'rls', label: 'authorized request', style: 'emphasis' },
      { id: 'rls-constraints', from: 'rls', to: 'constraints', label: 'checked write', style: 'emphasis' },
      { id: 'constraints-audit', from: 'constraints', to: 'audit', label: 'audit + monitoring', style: 'dashed' }
    ],
    views: [
      { id: 'perimeter', title: 'The perimeter', caption: 'The controls that live in front of everything: DNS, TLS, DDoS, WAF, rate limits, bot controls, Turnstile and custom rules.', nodes: ['internet', 'bots', 'dns', 'tls', 'ddos', 'waf', 'ratelimit', 'botctl', 'turnstile', 'rules'], edges: ['internet-dns', 'bots-ddos', 'bots-botctl'] },
      { id: 'layers', title: 'Identity → authorization → integrity', caption: 'Four different questions, four different layers. None of them can answer another layer’s question.', nodes: ['vercel', 'supabase', 'gotrue', 'appauth', 'rls', 'constraints'], edges: ['waf-vercel', 'ratelimit-supabase', 'vercel-auth', 'auth-appauth', 'appauth-rls', 'rls-constraints'] },
      { id: 'accountability', title: 'Accountability', caption: 'What the layers above can only detect after the fact.', nodes: ['rls', 'constraints', 'audit'], edges: ['constraints-audit'] }
    ],
    notes: [
      {
        title: 'Responsibility split',
        body: [
          'Cloudflare can only answer the first question. Treating it as an authorization layer is how a perimeter control quietly becomes the only control.'
        ],
        table: {
          headers: ['Layer', 'Responsibility'],
          rows: [
            ['Cloudflare', 'Perimeter, DDoS, WAF, rate limits, bot / challenge controls'],
            ['Vercel', 'Web hosting, build and deployment'],
            ['Supabase Auth', 'Identity, sessions, JWT'],
            ['Application', 'Business authorization and validation'],
            ['PostgreSQL RLS', 'Tenant and row authorization'],
            ['Database', 'Integrity constraints'],
            ['Audit / monitoring', 'Accountability and detection']
          ]
        }
      },
      {
        callout: true,
        tag: 'This separation is mandatory',
        body: [
          'Cloudflare should answer <strong>“should this traffic reach the application?”</strong>. Supabase Auth answers <strong>“who is this user?”</strong>. PostgreSQL RLS answers <strong>“can this user access this row?”</strong>. Each is useless as a substitute for the others.'
        ]
      },
      {
        title: 'What the edge cannot do',
        body: [
          'A rate limit can slow an abusive client; it cannot decide whether that client is entitled to a given tenant’s rows. That decision stays inside PostgreSQL, which is why the architecture keeps the perimeter, the identity provider and the authorization boundary in separate hands.'
        ],
        bullets: [
          'perimeter controls are probabilistic and tuned against real traffic',
          'identity is a claim about a session, not an entitlement to data',
          'RLS is the only layer that sees the row being requested',
          'audit and monitoring detect what the others could not prevent'
        ]
      }
    ]
  },

  /* ------------------------------------------------------------ 16 */
  {
    slug: 'trust-boundaries',
    navLabel: 'Trust boundaries',
    kind: 'Boundaries',
    accent: '--security-stroke',
    title: 'Trust boundaries',
    lede: 'Four crossings where trust changes, and what enforces each one.',
    description: 'Trust boundary diagram: the untrusted internet, the Cloudflare security zone, the Vercel and Supabase service zones, the PostgreSQL authorization zone and the outbound integration boundary.',
    lanes: [
      { id: 'untrusted', label: 'Untrusted internet', w: 200 },
      { id: 'cfzone', label: 'TB-01 → Cloudflare security zone', w: 218 },
      { id: 'service', label: 'TB-02 → Service zones', w: 218 },
      { id: 'pgzone', label: 'TB-03 → Postgres authorization zone', w: 232 },
      { id: 'integrations', label: 'TB-04 → Outbound integrations', w: 208 }
    ],
    regions: [
      { id: 'cfbox', label: 'Perimeter — no trust is granted here', lanes: ['cfzone'], kind: 'security-group' },
      { id: 'pgbox', label: 'Authoritative multi-tenant boundary', lanes: ['pgzone'], kind: 'security-group' }
    ],
    nodes: [
      { id: 'browsers', lane: 'untrusted', label: 'Browsers', kind: 'external', h: 46, doc: '16-trust-boundaries.md' },
      { id: 'bots', lane: 'untrusted', label: 'Bots · scanners · attackers', kind: 'external', h: 46, doc: '16-trust-boundaries.md' },
      { id: 'publicclients', lane: 'untrusted', label: 'Public clients', kind: 'external', h: 46, doc: '16-trust-boundaries.md' },
      { id: 'agents', lane: 'untrusted', label: 'AI coding agents', sublabel: 'outside the production boundary', kind: 'security', h: 56, doc: '12-ai-software-factory-contract.md', detail: 'Outside the production trust boundary entirely, and given least-privilege development credentials only. An agent may change the architecture; it may not hold a credential that reaches production data.' },

      { id: 'dns', lane: 'cfzone', label: 'DNS / TLS', kind: 'cloud', h: 44, doc: '18-cloudflare-supabase-topology.md' },
      { id: 'waf', lane: 'cfzone', label: 'WAF', kind: 'security', h: 44, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'ddos', lane: 'cfzone', label: 'DDoS', kind: 'security', h: 44, doc: '15-cloudflare-security-edge.md' },
      { id: 'ratelimit', lane: 'cfzone', label: 'Rate limits', kind: 'security', h: 44, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'botctl', lane: 'cfzone', label: 'Bot controls', kind: 'security', h: 44, doc: '17-waf-rate-limit-matrix.md' },

      { id: 'vercel', lane: 'service', label: 'Vercel application', sublabel: 'React web application', kind: 'frontend', doc: '08-clients.md' },
      { id: 'supabase', lane: 'service', label: 'Supabase service zone', sublabel: 'Auth · PostgREST · Storage · Realtime', kind: 'cloud', doc: '18-cloudflare-supabase-topology.md' },
      { id: 'edgefns', lane: 'service', label: 'Edge Functions', sublabel: 'service_role · server-side only', kind: 'security', doc: '02-runtime.md', detail: 'The only place a service-role credential may exist. It never crosses TB-03 into a browser or a mobile binary.' },

      { id: 'jwt', lane: 'pgzone', label: 'JWT', kind: 'database', h: 44, doc: '16-trust-boundaries.md' },
      { id: 'orgmember', lane: 'pgzone', label: 'org membership', kind: 'database', h: 44, doc: '03-multitenancy-security.md' },
      { id: 'rls', lane: 'pgzone', label: 'RLS', kind: 'security', h: 44, doc: '03-multitenancy-security.md', detail: 'The row set is decided inside Postgres after the query arrives, so a forged client meets the same gate as the application.' },
      { id: 'rowaccess', lane: 'pgzone', label: 'row access', kind: 'database', h: 44, doc: '16-trust-boundaries.md' },

      { id: 'banking', lane: 'integrations', label: 'Banking', kind: 'external', h: 46, doc: '07-api-integrations.md' },
      { id: 'payments', lane: 'integrations', label: 'Payment', kind: 'external', h: 46, doc: '06-finance-payments.md' },
      { id: 'email', lane: 'integrations', label: 'Email / SMS', kind: 'external', h: 46, doc: '07-api-integrations.md' },
      { id: 'accounting', lane: 'integrations', label: 'Accounting', kind: 'external', h: 46, doc: '07-api-integrations.md' }
    ],
    edges: [
      { id: 'browsers-waf', from: 'browsers', to: 'waf', label: 'TB-01', style: 'emphasis', flow: true },
      { id: 'bots-ddos', from: 'bots', to: 'ddos', label: 'TB-01', style: 'dashed' },
      { id: 'clients-ratelimit', from: 'publicclients', to: 'ratelimit', label: 'TB-01', style: 'dashed' },
      { id: 'waf-vercel', from: 'waf', to: 'vercel', label: 'TB-02', style: 'emphasis', flow: true },
      { id: 'ratelimit-supabase', from: 'ratelimit', to: 'supabase', label: 'TB-02', style: 'dashed' },
      { id: 'vercel-jwt', from: 'vercel', to: 'jwt', label: 'TB-03 · web', style: 'emphasis' },
      { id: 'supabase-jwt', from: 'supabase', to: 'jwt', label: 'TB-03 · api', style: 'emphasis' },
      { id: 'edgefns-jwt', from: 'edgefns', to: 'jwt', label: 'TB-03 · service_role', style: 'security' },
      { id: 'jwt-org', from: 'jwt', to: 'orgmember', style: 'emphasis' },
      { id: 'org-rls', from: 'orgmember', to: 'rls', style: 'emphasis' },
      { id: 'rls-rows', from: 'rls', to: 'rowaccess', style: 'emphasis' },
      { id: 'rows-banking', from: 'rowaccess', to: 'banking', label: 'TB-04', style: 'dashed' },
      { id: 'rows-payments', from: 'rowaccess', to: 'payments', style: 'dashed' },
      { id: 'rows-email', from: 'rowaccess', to: 'email', style: 'dashed' },
      { id: 'rows-accounting', from: 'rowaccess', to: 'accounting', style: 'dashed' }
    ],
    views: [
      { id: 'all', title: 'The four boundaries', caption: 'Traffic crosses four times, and trust is granted only once — at the row, by RLS.', nodes: ['browsers', 'bots', 'publicclients', 'agents', 'dns', 'waf', 'ddos', 'ratelimit', 'botctl', 'vercel', 'supabase', 'edgefns', 'jwt', 'orgmember', 'rls', 'rowaccess', 'banking', 'payments', 'email', 'accounting'] },
      { id: 'inbound', title: 'TB-01 · inbound traffic', caption: 'Nothing arriving from the internet is trusted; the perimeter only decides what is allowed to reach the origins.', nodes: ['browsers', 'bots', 'publicclients', 'dns', 'waf', 'ddos', 'ratelimit', 'botctl', 'vercel', 'supabase'], edges: ['browsers-waf', 'bots-ddos', 'clients-ratelimit', 'waf-vercel', 'ratelimit-supabase'] },
      { id: 'authorization', title: 'TB-03 · the authoritative boundary', caption: 'JWT to membership to RLS to the row. This is the only place tenancy is actually decided.', nodes: ['vercel', 'supabase', 'edgefns', 'jwt', 'orgmember', 'rls', 'rowaccess'], edges: ['vercel-jwt', 'supabase-jwt', 'edgefns-jwt', 'jwt-org', 'org-rls', 'rls-rows'] },
      { id: 'outbound', title: 'TB-04 · outbound integrations', caption: 'Data leaving the boundary: banking, payments, messaging and accounting.', nodes: ['rowaccess', 'banking', 'payments', 'email', 'accounting'], edges: ['rows-banking', 'rows-payments', 'rows-email', 'rows-accounting'] },
      { id: 'custody', title: 'Service-role custody', caption: 'The one credential that may cross TB-03, held only in a trusted server-side environment.', nodes: ['edgefns', 'jwt', 'rls'], edges: ['edgefns-jwt'] }
    ],
    notes: [
      {
        title: 'What each boundary is for',
        body: ['Each crossing changes who is trusted and what enforces the change.'],
        table: {
          headers: ['Boundary', 'Crossing', 'Enforced by'],
          rows: [
            ['TB-01', 'Internet → Cloudflare', 'Perimeter controls: WAF, DDoS, rate limits, bot controls'],
            ['TB-02', 'Cloudflare → Vercel / Supabase', 'Origin configuration and TLS'],
            ['TB-03', 'Service zone → Postgres', 'JWT → org membership → RLS → row access'],
            ['TB-04', 'Postgres → external integrations', 'Integration adapters, idempotency, webhook verification']
          ]
        }
      },
      {
        callout: true,
        tag: 'Two rules that define the boundary',
        body: [
          'Service-role credentials are restricted to trusted server-side environments such as Edge Functions, and are never exposed to web or mobile clients.',
          'AI coding agents are outside the production trust boundary. They receive least-privilege development credentials only — an agent may change the architecture, but it may not hold a credential that reaches production data.'
        ]
      },
      {
        title: 'Reading the diagram',
        body: [
          'The zones are not layers of the same control — they are different owners of different questions. Cloudflare owns reachability, Supabase Auth owns identity, and PostgreSQL owns entitlement to a row.'
        ]
      }
    ]
  },

  /* ------------------------------------------------------------ 17 */
  {
    slug: 'waf-rate-limits',
    navLabel: 'WAF & rate limits',
    kind: 'Controls',
    accent: '--security-stroke',
    title: 'WAF & rate-limit matrix',
    lede: 'Which control acts on which surface, with the starting policy for each — and the actions that follow.',
    description: 'WAF and rate-limit matrix: the Cloudflare control families mapped onto authentication, API and data, money and machine, and elevated surfaces, with the threat and starting policy for each.',
    lanes: [
      { id: 'controls', label: 'Perimeter controls', w: 218 },
      { id: 'auth', label: 'Authentication surfaces', w: 218 },
      { id: 'api', label: 'API & data surfaces', w: 222 },
      { id: 'money', label: 'Money & machine surfaces', w: 224 },
      { id: 'elevated', label: 'Elevated surfaces', w: 208 }
    ],
    nodes: [
      { id: 'ratelimit', lane: 'controls', label: 'Rate-limit engine', sublabel: 'per-client counters', kind: 'security', doc: '17-waf-rate-limit-matrix.md', detail: 'Counts per client, not per tenant or per account. It shapes traffic; it does not decide entitlement.' },
      { id: 'waf', lane: 'controls', label: 'Managed WAF baseline', sublabel: 'common web + API attacks', kind: 'security', doc: '17-waf-rate-limit-matrix.md' },
      { id: 'rules', lane: 'controls', label: 'Custom WAF rules', sublabel: 'seven rule categories', kind: 'security', doc: '17-waf-rate-limit-matrix.md' },
      { id: 'challenge', lane: 'controls', label: 'Challenge / Turnstile', sublabel: 'adaptive, then block', kind: 'security', doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'block', lane: 'controls', label: 'Block · 429', sublabel: 'hard stop on abuse', kind: 'security', doc: '17-waf-rate-limit-matrix.md' },

      { id: 'login', lane: 'auth', label: '/auth/login', sublabel: 'credential stuffing · 5 / 5 min · challenge then block', kind: 'frontend', doc: '17-waf-rate-limit-matrix.md' },
      { id: 'signup', lane: 'auth', label: '/auth/signup', sublabel: 'fake accounts · 5 / 10 min · Turnstile', kind: 'frontend', doc: '17-waf-rate-limit-matrix.md' },
      { id: 'reset', lane: 'auth', label: '/auth/reset', sublabel: 'reset abuse · 5 / 15 min · challenge', kind: 'frontend', doc: '17-waf-rate-limit-matrix.md' },

      { id: 'api', lane: 'api', label: '/api/*', sublabel: 'API abuse · 120 / min · 429 or challenge', kind: 'backend', doc: '17-waf-rate-limit-matrix.md' },
      { id: 'properties', lane: 'api', label: '/properties/*', sublabel: 'scraping · 120 / min · challenge', kind: 'backend', doc: '17-waf-rate-limit-matrix.md' },
      { id: 'documents', lane: 'api', label: '/documents/*', sublabel: 'bulk access · 60 / min · challenge', kind: 'backend', doc: '17-waf-rate-limit-matrix.md' },

      { id: 'payments', lane: 'money', label: '/payments/*', sublabel: 'transaction abuse · 20 / min · block or challenge', kind: 'database', doc: '06-finance-payments.md' },
      { id: 'webhooks', lane: 'money', label: '/webhooks/*', sublabel: 'flooding · provider-specific · validate + rate limit', kind: 'queue', doc: '07-api-integrations.md' },
      { id: 'upload', lane: 'money', label: 'File upload', sublabel: 'resource exhaustion · 20 / 10 min · block or challenge', kind: 'storage', doc: '17-waf-rate-limit-matrix.md' },

      { id: 'admin', lane: 'elevated', label: '/admin/*', sublabel: 'admin attack · very restrictive · challenge / allowlist', kind: 'security', doc: '19-cloudflare-zero-trust.md' },
      { id: 'public', lane: 'elevated', label: '/public/*', sublabel: 'bot spam · 60 / min · challenge', kind: 'external', doc: '17-waf-rate-limit-matrix.md' }
    ],
    edges: [
      { id: 'ratelimit-login', from: 'ratelimit', to: 'login', label: '5 / 5 min · client', style: 'emphasis', flow: true },
      { id: 'challenge-signup', from: 'challenge', to: 'signup', label: 'Turnstile', style: 'emphasis' },
      { id: 'challenge-reset', from: 'challenge', to: 'reset', label: '5 / 15 min', style: 'dashed' },
      { id: 'rules-api', from: 'rules', to: 'api', label: '120 / min · client', style: 'emphasis' },
      { id: 'block-payments', from: 'block', to: 'payments', label: '20 / min', style: 'security' },
      { id: 'block-admin', from: 'block', to: 'admin', label: 'very restrictive', style: 'security' }
    ],
    views: [
      { id: 'auth', title: 'Authentication surfaces', caption: 'The three surfaces where credential stuffing and fake accounts land first.', nodes: ['ratelimit', 'challenge', 'login', 'signup', 'reset'], edges: ['ratelimit-login', 'challenge-signup', 'challenge-reset'] },
      { id: 'api', title: 'API & data surfaces', caption: 'Abuse that looks like normal traffic: bursts, scraping and bulk document access.', nodes: ['rules', 'api', 'properties', 'documents'], edges: ['rules-api'] },
      { id: 'money', title: 'Money & machine surfaces', caption: 'Where the cost of abuse is financial or infrastructural rather than reputational.', nodes: ['block', 'payments', 'webhooks', 'upload'], edges: ['block-payments'] },
      { id: 'elevated', title: 'Elevated surfaces', caption: 'Administration is the surface where a challenge is cheap and a breach is not.', nodes: ['block', 'admin', 'public'], edges: ['block-admin'] }
    ],
    notes: [
      {
        title: 'The full matrix',
        body: [
          'Starting-point values for EstateSync. They must be tuned against real traffic and false-positive data — the numbers are a hypothesis, not a specification.'
        ],
        table: {
          headers: ['Surface', 'Threat', 'Starting policy', 'Action'],
          rows: [
            ['/auth/login', 'Credential stuffing', '5 / 5 min / client', 'Challenge, then block'],
            ['/auth/signup', 'Fake accounts', '5 / 10 min / client', 'Turnstile / challenge'],
            ['/auth/reset', 'Reset abuse', '5 / 15 min / client', 'Challenge'],
            ['/api/*', 'API abuse', '120 / min / client', '429 / challenge'],
            ['/properties/*', 'Scraping', '120 / min / client', 'Challenge'],
            ['/documents/*', 'Bulk access', '60 / min / client', 'Challenge'],
            ['/payments/*', 'Transaction abuse', '20 / min / client', 'Block / challenge'],
            ['/webhooks/*', 'Flooding', 'Provider-specific', 'Validate + rate limit'],
            ['/admin/*', 'Admin attack', 'Very restrictive', 'Challenge / allowlist'],
            ['/public/*', 'Bot / spam', '60 / min / client', 'Challenge'],
            ['File upload', 'Resource exhaustion', '20 / 10 min / client', 'Block / challenge']
          ]
        }
      },
      {
        title: 'Custom rule categories',
        body: ['Beyond the managed baseline, the rules that are specific to this application:'],
        ordered: [
          'block known malicious sources',
          'challenge anomalous login traffic',
          'restrict unexpected HTTP methods',
          'protect sensitive paths',
          'challenge suspicious automation',
          'protect administration surfaces',
          'restrict webhook traffic where provider IP / signature controls permit'
        ]
      },
      {
        callout: true,
        tag: 'A perimeter control is not a business control',
        body: [
          'Rate limiting is a perimeter control, not a precise business counter. Application authorization, idempotency and financial controls remain inside EstateSync — the edge decides whether traffic arrives, not what it is allowed to do.'
        ]
      }
    ]
  },

  /* ------------------------------------------------------------ 18 */
  {
    slug: 'deployment-topology',
    navLabel: 'Deployment topology',
    kind: 'Topology',
    accent: '--cloud-stroke',
    title: 'Deployment topology',
    lede: 'How DNS, the Cloudflare edge and the two origins fit together — with and without an API gateway.',
    description: 'Cloudflare and Supabase deployment topology: the DNS surfaces, the edge controls, Option A with origins directly behind Cloudflare, Option B with a selective Worker API gateway, and the mobile path.',
    lanes: [
      { id: 'clients', label: 'Clients', w: 196 },
      { id: 'dns', label: 'DNS surfaces', w: 218 },
      { id: 'edge', label: 'Cloudflare', w: 218 },
      { id: 'origins', label: 'Origins', w: 224 },
      { id: 'data', label: 'PostgreSQL', w: 202 }
    ],
    regions: [
      { id: 'edgebox', label: 'Shared edge — every hostname passes through here', lanes: ['edge'], kind: 'security-group' }
    ],
    nodes: [
      { id: 'browser', lane: 'clients', label: 'Browser', kind: 'frontend', doc: '08-clients.md' },
      { id: 'mobile', lane: 'clients', label: 'Mobile app', sublabel: 'Supabase client pattern', kind: 'frontend', doc: '18-cloudflare-supabase-topology.md', detail: 'Mobile uses Supabase Auth and the normal Supabase client pattern. PostgreSQL RLS remains its tenant-isolation boundary — there is no Vercel application in that path.' },

      { id: 'app', lane: 'dns', label: 'app.example.com', sublabel: '→ Vercel', kind: 'cloud', h: 52, doc: '18-cloudflare-supabase-topology.md' },
      { id: 'www', lane: 'dns', label: 'www.example.com', sublabel: '→ Vercel', kind: 'cloud', h: 52, doc: '18-cloudflare-supabase-topology.md' },
      { id: 'staging', lane: 'dns', label: 'staging.example.com', sublabel: '→ staging environment', kind: 'cloud', h: 52, doc: '18-cloudflare-supabase-topology.md' },
      { id: 'adminhost', lane: 'dns', label: 'admin.example.com', sublabel: '→ protected administrative surface', kind: 'security', h: 52, doc: '19-cloudflare-zero-trust.md' },

      { id: 'tls', lane: 'edge', label: 'TLS', kind: 'cloud', h: 44, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'waf', lane: 'edge', label: 'WAF', kind: 'security', h: 44, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'ratelimit', lane: 'edge', label: 'Rate limits', kind: 'security', h: 44, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'turnstile', lane: 'edge', label: 'Turnstile', kind: 'security', h: 44, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'rules', lane: 'edge', label: 'Security rules', kind: 'security', h: 44, doc: '17-waf-rate-limit-matrix.md' },

      { id: 'vercel', lane: 'origins', label: 'Vercel', sublabel: 'web application', kind: 'frontend', doc: '18-cloudflare-supabase-topology.md' },
      { id: 'gateway', lane: 'origins', label: 'Worker / API gateway', sublabel: 'Option B · sensitive APIs only', kind: 'security', doc: '18-cloudflare-supabase-topology.md', detail: 'Use selectively for sensitive APIs or integrations where centralised edge controls justify the added complexity. Do not proxy every CRUD operation without a concrete requirement.' },
      { id: 'supabase', lane: 'origins', label: 'Supabase', sublabel: 'Auth · PostgREST · Storage · Edge Functions', kind: 'cloud', doc: '18-cloudflare-supabase-topology.md' },

      { id: 'postgres', lane: 'data', label: 'PostgreSQL', sublabel: 'integrity constraints', kind: 'database', doc: '04-data-model.md' },
      { id: 'rls', lane: 'data', label: 'RLS', sublabel: 'authoritative tenant boundary', kind: 'security', h: 52, doc: '03-multitenancy-security.md' }
    ],
    edges: [
      { id: 'browser-app', from: 'browser', to: 'app', label: 'https', style: 'emphasis', flow: true },
      { id: 'mobile-supabase', from: 'mobile', to: 'supabase', label: 'Supabase client · Auth + RLS', style: 'emphasis' },
      { id: 'adminhost-rules', from: 'adminhost', to: 'rules', label: 'protected surface', style: 'security' },
      { id: 'waf-vercel', from: 'waf', to: 'vercel', label: 'Option A', style: 'emphasis', flow: true },
      { id: 'rules-gateway', from: 'rules', to: 'gateway', label: 'Option B · selective', style: 'dashed' },
      { id: 'gateway-supabase', from: 'gateway', to: 'supabase', label: 'centralised edge controls', style: 'dashed' },
      { id: 'vercel-supabase', from: 'vercel', to: 'supabase', label: 'session', style: 'emphasis' },
      { id: 'supabase-postgres', from: 'supabase', to: 'postgres', label: 'PostgREST', style: 'emphasis', flow: true },
      { id: 'postgres-rls', from: 'postgres', to: 'rls', style: 'emphasis' }
    ],
    views: [
      { id: 'optiona', title: 'Option A — initial architecture', caption: 'Browser → Cloudflare → Vercel, with Supabase reached through the Supabase client. The simplest shape that still puts the perimeter in front of everything.', nodes: ['browser', 'app', 'waf', 'vercel', 'supabase', 'postgres', 'rls'], edges: ['browser-app', 'waf-vercel', 'vercel-supabase', 'supabase-postgres', 'postgres-rls'] },
      { id: 'optionb', title: 'Option B — controlled API gateway', caption: 'A Worker gateway in front of selected APIs, where centralised edge controls justify the extra hop.', nodes: ['browser', 'rules', 'gateway', 'supabase', 'postgres', 'rls'], edges: ['rules-gateway', 'gateway-supabase', 'supabase-postgres', 'postgres-rls'] },
      { id: 'surfaces', title: 'DNS surfaces', caption: 'Every hostname is deliberate — including the ones that are not public.', nodes: ['app', 'www', 'staging', 'adminhost', 'rules'], edges: ['adminhost-rules'] },
      { id: 'mobile', title: 'The mobile path', caption: 'Mobile talks to Supabase directly; RLS is its isolation boundary.', nodes: ['mobile', 'supabase', 'postgres', 'rls'], edges: ['mobile-supabase', 'supabase-postgres', 'postgres-rls'] }
    ],
    notes: [
      {
        title: 'Option A or Option B',
        body: ['Both are supported; the choice is per-API, not per-project.'],
        table: {
          headers: ['Option', 'Path', 'Use when'],
          rows: [
            ['A — initial', 'Browser → Cloudflare → Vercel; Supabase via the Supabase client', 'Default. The perimeter protects the public application and RLS protects direct Supabase access.'],
            ['B — controlled gateway', 'Browser → Cloudflare → Worker / API gateway → Supabase', 'Selectively, for sensitive APIs or integrations where centralised edge controls justify the added complexity.']
          ]
        }
      },
      {
        title: 'DNS surfaces',
        body: ['Hostnames are part of the security posture, not just routing.'],
        bullets: [
          '<code>app.example.com</code> → Vercel',
          '<code>www.example.com</code> → Vercel',
          '<code>staging.example.com</code> → staging environment',
          '<code>admin.example.com</code> → protected administrative surface'
        ]
      },
      {
        callout: true,
        tag: 'Do not over-proxy',
        body: [
          'Do not proxy every CRUD operation without a concrete requirement, and do not expose internal infrastructure merely for convenience. Every added hop is a new place for authorization assumptions to hide.'
        ]
      }
    ]
  },

  /* ------------------------------------------------------------ 19 */
  {
    slug: 'zero-trust',
    navLabel: 'Zero Trust',
    kind: 'Internal access',
    accent: '--security-stroke',
    title: 'Zero Trust & internal access',
    lede: 'Cloudflare Access in front of everything that should never have been public in the first place.',
    description: 'Cloudflare Zero Trust internal access: developers and administrators authenticate through identity, MFA, device and access policies before reaching staging, dashboards, deployment tools and the AI software-factory control plane.',
    lanes: [
      { id: 'people', label: 'Developer / admin', w: 200 },
      { id: 'access', label: 'Cloudflare Access', w: 215 },
      { id: 'resources', label: 'Protected resources', w: 232 },
      { id: 'public', label: 'Public traffic', w: 208 }
    ],
    regions: [
      { id: 'accessbox', label: 'Identity-aware proxy — internal only', lanes: ['access'], kind: 'security-group' }
    ],
    nodes: [
      { id: 'developer', lane: 'people', label: 'Developer', kind: 'actor', doc: '19-cloudflare-zero-trust.md' },
      { id: 'administrator', lane: 'people', label: 'Administrator', kind: 'actor', doc: '19-cloudflare-zero-trust.md' },

      { id: 'identity', lane: 'access', label: 'Identity', kind: 'security', h: 44, doc: '19-cloudflare-zero-trust.md' },
      { id: 'mfa', lane: 'access', label: 'MFA', kind: 'security', h: 44, doc: '03-multitenancy-security.md' },
      { id: 'device', lane: 'access', label: 'Device policy', kind: 'security', h: 44, doc: '19-cloudflare-zero-trust.md' },
      { id: 'policy', lane: 'access', label: 'Access policy', kind: 'security', h: 44, doc: '19-cloudflare-zero-trust.md', detail: 'The final gate before an internal resource. Public customer traffic and internal administration are governed by separate policies on purpose.' },

      { id: 'staging', lane: 'resources', label: 'Staging environments', kind: 'cloud', h: 46, doc: '09-cicd-devsecops.md' },
      { id: 'adminportal', lane: 'resources', label: 'Internal admin portal', kind: 'security', h: 46, doc: '19-cloudflare-zero-trust.md' },
      { id: 'monitoring', lane: 'resources', label: 'Monitoring dashboards', kind: 'external', h: 46, doc: '10-dr-operations.md' },
      { id: 'deploy', lane: 'resources', label: 'Deployment tools', kind: 'backend', h: 46, doc: '09-cicd-devsecops.md' },
      { id: 'factory', lane: 'resources', label: 'AI software-factory control plane', kind: 'backend', h: 46, doc: '12-ai-software-factory-contract.md' },
      { id: 'devsvc', lane: 'resources', label: 'Development services', kind: 'backend', h: 46, doc: '19-cloudflare-zero-trust.md' },
      { id: 'dbadmin', lane: 'resources', label: 'Database administration', kind: 'database', h: 46, doc: '19-cloudflare-zero-trust.md' },

      { id: 'customers', lane: 'public', label: 'Public customer traffic', sublabel: 'WAF · rate limits · separate policy', kind: 'external', doc: '15-cloudflare-security-edge.md' }
    ],
    edges: [
      { id: 'developer-identity', from: 'developer', to: 'identity', label: 'authenticate', style: 'emphasis', flow: true },
      { id: 'admin-identity', from: 'administrator', to: 'identity', style: 'emphasis' },
      { id: 'identity-mfa', from: 'identity', to: 'mfa', style: 'emphasis' },
      { id: 'mfa-device', from: 'mfa', to: 'device', style: 'emphasis' },
      { id: 'device-policy', from: 'device', to: 'policy', style: 'emphasis' },
      { id: 'policy-staging', from: 'policy', to: 'staging', style: 'dashed' },
      { id: 'policy-adminportal', from: 'policy', to: 'adminportal', style: 'dashed' },
      { id: 'policy-monitoring', from: 'policy', to: 'monitoring', style: 'dashed' },
      { id: 'policy-deploy', from: 'policy', to: 'deploy', style: 'dashed' },
      { id: 'policy-factory', from: 'policy', to: 'factory', style: 'dashed' },
      { id: 'policy-devsvc', from: 'policy', to: 'devsvc', style: 'dashed' },
      { id: 'policy-dbadmin', from: 'policy', to: 'dbadmin', style: 'dashed' },
      { id: 'policy-customers', from: 'policy', to: 'customers', label: 'separate policy', style: 'security' }
    ],
    views: [
      { id: 'who', title: 'Who authenticates', caption: 'Identity, MFA, device posture, then an access policy — in that order, before anything internal is reachable.', nodes: ['developer', 'administrator', 'identity', 'mfa', 'device', 'policy'], edges: ['developer-identity', 'admin-identity', 'identity-mfa', 'mfa-device', 'device-policy'] },
      { id: 'resources', title: 'Protected resources', caption: 'Everything here should be unreachable without an identity-aware proxy in front of it.', nodes: ['policy', 'staging', 'adminportal', 'monitoring', 'deploy', 'factory', 'devsvc', 'dbadmin'], edges: ['policy-staging', 'policy-adminportal', 'policy-monitoring', 'policy-deploy', 'policy-factory', 'policy-devsvc', 'policy-dbadmin'] },
      { id: 'split', title: 'Public vs internal', caption: 'Customer traffic and administration are different populations with different policies.', nodes: ['policy', 'customers', 'adminportal', 'staging'], edges: ['policy-customers', 'policy-adminportal', 'policy-staging'] }
    ],
    notes: [
      {
        title: 'Candidate protected resources',
        body: ['Cloudflare can protect internal EstateSync and software-factory resources that should never be public:'],
        bullets: [
          'staging environments',
          'internal admin portal',
          'monitoring dashboards',
          'deployment tools',
          'AI software-factory control plane',
          'development services',
          'database administration interfaces'
        ]
      },
      {
        title: 'How the gate is composed',
        body: ['Each step narrows who can continue.'],
        ordered: [
          'identity — who is asking',
          'MFA — proof that it is really them',
          'device policy — what they are asking from',
          'access policy — whether that identity may reach this resource'
        ]
      },
      {
        callout: true,
        tag: 'Not a substitute',
        body: [
          'Zero Trust protects <em>reachability of internal tools</em>. It is not a replacement for PostgreSQL RLS: an authenticated developer reaching staging still meets RLS on every row, and a compromised internal session still cannot read another tenant’s data.'
        ]
      },
      {
        title: 'Separate policies',
        body: [
          'Public customer traffic and internal administration should have separate access policies. Sharing one policy across both populations means the weaker requirement silently sets the bar for the stronger one.'
        ]
      }
    ]
  },

  /* ------------------------------------------------------------ 20 */
  {
    slug: 'implementation-checklist',
    navLabel: 'Rollout checklist',
    kind: 'Rollout',
    accent: '--backend-stroke',
    title: 'Cloudflare implementation checklist',
    lede: 'Five phases from DNS to a tested perimeter — each phase a gate on the next.',
    description: 'Cloudflare implementation checklist as five gated phases: baseline, abuse controls, Turnstile, advanced controls and security tests, with the expected control chain.',
    lanes: [
      { id: 'phase1', label: 'Phase 1 · Baseline', w: 206 },
      { id: 'phase2', label: 'Phase 2 · Abuse controls', w: 206 },
      { id: 'phase3', label: 'Phase 3 · Turnstile', w: 206 },
      { id: 'phase4', label: 'Phase 4 · Advanced', w: 206 },
      { id: 'phase5', label: 'Phase 5 · Security tests', w: 216 }
    ],
    nodes: [
      { id: 'dns', lane: 'phase1', label: 'Move DNS to Cloudflare', kind: 'cloud', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'tls', lane: 'phase1', label: 'Enable HTTPS / TLS', kind: 'cloud', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'waf', lane: 'phase1', label: 'Managed WAF baseline', kind: 'security', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'events', lane: 'phase1', label: 'Review Security Events', kind: 'security', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'headers', lane: 'phase1', label: 'Security headers', kind: 'security', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'domains', lane: 'phase1', label: 'Confirm origins & domains', kind: 'cloud', h: 46, doc: '18-cloudflare-supabase-topology.md' },

      { id: 'login', lane: 'phase2', label: 'Rate-limit login', kind: 'frontend', h: 46, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'signup', lane: 'phase2', label: 'Rate-limit signup', kind: 'frontend', h: 46, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'reset', lane: 'phase2', label: 'Rate-limit password reset', kind: 'frontend', h: 46, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'forms', lane: 'phase2', label: 'Rate-limit public forms', kind: 'frontend', h: 46, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'files', lane: 'phase2', label: 'Protect file operations', kind: 'storage', h: 46, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'paymentinit', lane: 'phase2', label: 'Protect payment initiation', kind: 'database', h: 46, doc: '06-finance-payments.md' },
      { id: 'webhooks', lane: 'phase2', label: 'Protect webhooks', kind: 'queue', h: 46, doc: '07-api-integrations.md' },

      { id: 'widgets', lane: 'phase3', label: 'Separate widgets per environment', kind: 'security', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'tsignup', lane: 'phase3', label: 'Turnstile on signup', kind: 'security', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'treset', lane: 'phase3', label: 'Turnstile on password reset', kind: 'security', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'tlogin', lane: 'phase3', label: 'Adaptive protection on login', kind: 'security', h: 46, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'token', lane: 'phase3', label: 'Validate every token server-side', kind: 'security', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'secret', lane: 'phase3', label: 'Secret key server-side only', kind: 'security', h: 46, doc: '03-multitenancy-security.md' },

      { id: 'customrules', lane: 'phase4', label: 'Custom WAF rules', kind: 'security', h: 46, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'botpolicy', lane: 'phase4', label: 'Bot / challenge policies', kind: 'security', h: 46, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'adminpaths', lane: 'phase4', label: 'Protect admin paths', kind: 'security', h: 46, doc: '19-cloudflare-zero-trust.md' },
      { id: 'access', lane: 'phase4', label: 'Access for internal tools', kind: 'security', h: 46, doc: '19-cloudflare-zero-trust.md' },
      { id: 'worker', lane: 'phase4', label: 'Worker gateway where justified', kind: 'backend', h: 46, doc: '18-cloudflare-supabase-topology.md' },
      { id: 'falsepos', lane: 'phase4', label: 'Review false positives', kind: 'security', h: 46, doc: '17-waf-rate-limit-matrix.md' },

      { id: 'stuffing', lane: 'phase5', label: 'Credential stuffing', kind: 'external', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'automation', lane: 'phase5', label: 'Signup automation', kind: 'external', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'bursts', lane: 'phase5', label: 'API bursts', kind: 'external', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'enumeration', lane: 'phase5', label: 'Document enumeration', kind: 'external', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'crosstenant', lane: 'phase5', label: 'Cross-tenant IDs', kind: 'external', h: 46, doc: '03-multitenancy-security.md' },
      { id: 'payloads', lane: 'phase5', label: 'Malicious payloads', kind: 'external', h: 46, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'forged', lane: 'phase5', label: 'Forged webhooks', kind: 'external', h: 46, doc: '07-api-integrations.md' },
      { id: 'adminaccess', lane: 'phase5', label: 'Unauthorized admin access', kind: 'external', h: 46, doc: '20-cloudflare-implementation-checklist.md' }
    ],
    edges: [
      { id: 'p1-p2', from: 'domains', to: 'login', label: 'baseline in place', style: 'emphasis', flow: true },
      { id: 'p2-p3', from: 'webhooks', to: 'widgets', label: 'abuse controls on', style: 'emphasis', flow: true },
      { id: 'p3-p4', from: 'secret', to: 'customrules', label: 'automation challenged', style: 'emphasis', flow: true },
      { id: 'p4-p5', from: 'falsepos', to: 'stuffing', label: 'then prove it', style: 'emphasis', flow: true }
    ],
    views: [
      { id: 'phase1', title: 'Phase 1 · Baseline', caption: 'Get DNS, TLS and the managed WAF in place, and know where to look when something happens.', nodes: ['dns', 'tls', 'waf', 'events', 'headers', 'domains'] },
      { id: 'phase2', title: 'Phase 2 · Abuse controls', caption: 'Rate-limit the surfaces that attract automated abuse, in the order an attacker would try them.', nodes: ['login', 'signup', 'reset', 'forms', 'files', 'paymentinit', 'webhooks'] },
      { id: 'phase3', title: 'Phase 3 · Turnstile', caption: 'Add a challenge where a challenge is cheap — and keep the secret key off the client, always.', nodes: ['widgets', 'tsignup', 'treset', 'tlogin', 'token', 'secret'] },
      { id: 'phase4', title: 'Phase 4 · Advanced controls', caption: 'Custom rules, bot policies, admin protection and Cloudflare Access for internal tooling.', nodes: ['customrules', 'botpolicy', 'adminpaths', 'access', 'worker', 'falsepos'] },
      { id: 'phase5', title: 'Phase 5 · Security tests', caption: 'Prove the chain behaves as designed — including the cases the perimeter is not supposed to stop.', nodes: ['stuffing', 'automation', 'bursts', 'enumeration', 'crosstenant', 'payloads', 'forged', 'adminaccess'] },
      { id: 'gates', title: 'The gates between phases', caption: 'Each phase is a precondition for the next; none of them is a one-off task.', nodes: ['domains', 'login', 'widgets', 'customrules', 'stuffing'], edges: ['p1-p2', 'p2-p3', 'p3-p4', 'p4-p5'] }
    ],
    notes: [
      {
        title: 'Phase 1 — Baseline',
        checklist: ['Move authoritative DNS to Cloudflare', 'Enable HTTPS / TLS', 'Enable managed WAF baseline', 'Review Security Events', 'Configure security headers', 'Confirm Vercel / Supabase origins and domains']
      },
      {
        title: 'Phase 2 — Abuse controls',
        checklist: ['Rate-limit login', 'Rate-limit signup', 'Rate-limit password reset', 'Rate-limit public forms', 'Protect document / file operations', 'Protect payment initiation', 'Protect webhooks']
      },
      {
        title: 'Phase 3 — Turnstile',
        checklist: ['Separate development, staging and production widgets', 'Add Turnstile to signup', 'Add Turnstile to password reset', 'Add adaptive protection to login', 'Validate every token server-side', 'Keep the secret key server-side only']
      },
      {
        title: 'Phase 4 — Advanced controls',
        checklist: ['Add custom WAF rules', 'Add bot / challenge policies', 'Protect admin paths', 'Add Cloudflare Access for internal tools', 'Add Worker gateway only where justified', 'Review false positives periodically']
      },
      {
        title: 'Phase 5 — Security tests',
        checklist: ['Credential stuffing', 'Signup automation', 'API bursts', 'Document enumeration', 'Cross-tenant IDs', 'Malicious payloads', 'Forged webhooks', 'Unauthorized admin access']
      },
      {
        title: 'Expected control chain',
        body: ['Each attack class should be rejected by the outermost layer that can see it — and the ones the perimeter cannot see must still be rejected inside.'],
        table: {
          headers: ['Attack', 'Rejected by'],
          rows: [
            ['Perimeter attack', 'Cloudflare mitigates'],
            ['Unauthenticated call', 'Supabase Auth rejects'],
            ['Wrong tenant row', 'PostgreSQL RLS rejects'],
            ['Invalid business state', 'DB / application constraints reject'],
            ['Suspicious automation', 'Challenge / block']
          ]
        }
      }
    ]
  },

  /* ------------------------------------------------------------ 14 · v1.1 + 20 */
  {
    slug: 'control-chain',
    navLabel: 'Control chain',
    kind: 'Defence layers',
    accent: '--database-stroke',
    title: 'Control chain',
    lede: 'Seven layers, seven questions, and the specific attack class each one is responsible for rejecting.',
    description: 'Layered defence chain: internet, Cloudflare perimeter, Supabase Auth, application authorization, PostgreSQL RLS, database constraints and audit, with the rejection each layer produces.',
    lanes: [
      { id: 'front', label: 'Perimeter → identity → application', w: 268 },
      { id: 'authz', label: 'Row → integrity → accountability', w: 268 }
    ],
    nodes: [
      { id: 'internet', lane: 'front', label: 'Internet', sublabel: 'browsers · bots · scanners', kind: 'external', doc: '14-master-architecture.md' },
      { id: 'cf', lane: 'front', label: 'Cloudflare Security Edge', sublabel: 'WAF · rate limits · bot controls', kind: 'security', doc: '15-cloudflare-security-edge.md', detail: 'Should this traffic reach the application? A perimeter decision, and the only one Cloudflare is asked to make.' },
      { id: 'auth', lane: 'front', label: 'Supabase Auth', sublabel: 'sessions · JWT', kind: 'cloud', doc: '02-runtime.md', detail: 'Who is this user? Identity is established here and carried as a JWT — a claim about a session, never an entitlement to a row.' },
      { id: 'appauth', lane: 'front', label: 'Application authorization', sublabel: 'business rules · validation', kind: 'backend', doc: '07-api-integrations.md', detail: 'Is this request well formed and permitted for this actor? Zod-shaped input validation and business rules, enforced server-side.' },
      { id: 'rls', lane: 'authz', label: 'PostgreSQL RLS', sublabel: 'tenant + row authorization', kind: 'database', doc: '03-multitenancy-security.md', detail: 'Can this user access this row? The row set is decided inside Postgres after the query arrives — the authoritative multi-tenant boundary.' },
      { id: 'constraints', lane: 'authz', label: 'Database constraints', sublabel: 'integrity invariants', kind: 'database', doc: '04-data-model.md', detail: 'Is this state legal? Foreign keys, unique constraints and check constraints reject what no layer above could see.' },
      { id: 'audit', lane: 'authz', label: 'Audit & monitoring', sublabel: 'detection · accountability', kind: 'external', doc: '10-dr-operations.md', detail: 'What happened, and can we prove it? The layer that records material changes and detects what the others let through.' }
    ],
    edges: [
      { id: 'internet-cf', from: 'internet', to: 'cf', label: 'mitigated', style: 'security', flow: true },
      { id: 'cf-auth', from: 'cf', to: 'auth', label: 'unauthenticated', style: 'security' },
      { id: 'auth-appauth', from: 'auth', to: 'appauth', label: 'invalid input', style: 'emphasis' },
      { id: 'appauth-rls', from: 'appauth', to: 'rls', label: 'cross-tenant', style: 'security', flow: true },
      { id: 'rls-constraints', from: 'rls', to: 'constraints', label: 'illegal state', style: 'emphasis' },
      { id: 'constraints-audit', from: 'constraints', to: 'audit', label: 'recorded', style: 'dashed' }
    ],
    views: [
      { id: 'all', title: 'Who rejects what', caption: 'Traffic moves left to right; each layer owns one attack class and one question.', nodes: ['internet', 'cf', 'auth', 'appauth', 'rls', 'constraints', 'audit'] },
      { id: 'front', title: 'Perimeter & identity', caption: 'The two layers that decide whether a request becomes an actor at all.', nodes: ['internet', 'cf', 'auth'], edges: ['internet-cf', 'cf-auth'] },
      { id: 'authorization', title: 'Authorization & integrity', caption: 'The layers that decide what an authenticated actor may actually do.', nodes: ['auth', 'appauth', 'rls', 'constraints'], edges: ['auth-appauth', 'appauth-rls', 'rls-constraints'] },
      { id: 'accountability', title: 'Accountability', caption: 'Detection and evidence, after the decision has been made.', nodes: ['rls', 'constraints', 'audit'], edges: ['constraints-audit'] }
    ],
    notes: [
      {
        title: 'The chain, layer by layer',
        body: ['No layer can answer another layer’s question, which is why the chain is ordered this way.'],
        ordered: [
          '<strong>Cloudflare</strong> — should this traffic reach the application?',
          '<strong>Supabase Auth</strong> — who is this user?',
          '<strong>Application authorization</strong> — is this request valid and permitted?',
          '<strong>PostgreSQL RLS</strong> — can this user access this row?',
          '<strong>Database constraints</strong> — is this state legal?',
          '<strong>Audit &amp; monitoring</strong> — what happened, and can we prove it?'
        ]
      },
      {
        title: 'Expected control chain',
        body: ['From the implementation checklist — what should reject what:'],
        table: {
          headers: ['Attack', 'Rejected by'],
          rows: [
            ['Perimeter attack', 'Cloudflare mitigates'],
            ['Unauthenticated call', 'Supabase Auth rejects'],
            ['Wrong tenant row', 'PostgreSQL RLS rejects'],
            ['Invalid business state', 'DB / application constraints reject'],
            ['Suspicious automation', 'Challenge / block']
          ]
        }
      },
      {
        callout: true,
        tag: 'Defence in depth, not defence in sequence',
        body: [
          'Cloudflare is the perimeter security layer; PostgreSQL RLS remains the authoritative multi-tenant authorization boundary. The perimeter reduces load and noise, but a request that reaches Postgres still meets the gate that decides tenant access — and the layers below assume the ones above have already failed at least once.'
        ]
      }
    ]
  },

  /* ------------------------------------------------------------ 21 · plans */
  {
    slug: 'plan-coverage',
    navLabel: 'Plan coverage',
    kind: 'Plan limits',
    accent: '--cloud-stroke',
    title: 'Plan coverage',
    lede: 'What each Cloudflare plan actually provides, and where the v1.1 requirements land.',
    description: 'Cloudflare plan coverage for the v1.1 security expansion: what the Free plan provides, what Pro, Business and Enterprise each add, and which requirements cannot be met on Free at all.',
    align: 'top',
    lanes: [
      { id: 'free', label: 'Free · $0', w: 238 },
      { id: 'pro', label: 'Pro · ~$20–25 / zone / month', w: 238 },
      { id: 'business', label: 'Business · ~$200–250 / zone / month', w: 238 },
      { id: 'enterprise', label: 'Enterprise · custom', w: 238 }
    ],
    regions: [
      { id: 'freebox', label: 'Everything here is also on every paid plan', lanes: ['free'], kind: 'security-group' }
    ],
    nodes: [
      { id: 'f-ddos', lane: 'free', label: 'L3/4 + L7 DDoS protection', kind: 'security', h: 46, doc: '21-cloudflare-free-plan-feasibility.md', detail: 'Always on for every plan. Free gets exactly one override, and that override cannot carry a custom expression — so no per-path DDoS policy.' },
      { id: 'f-ruleset', lane: 'free', label: 'Free Managed Ruleset', kind: 'security', h: 46, doc: '21-cloudflare-free-plan-feasibility.md', detail: 'The only managed ruleset on Free, and it is deployed automatically. High-impact and widely exploited vulnerabilities, nothing broader.' },
      { id: 'f-custom', lane: 'free', label: 'Custom rules — 5', sublabel: 'no regex · no log action', kind: 'security', h: 56, doc: '21-cloudflare-free-plan-feasibility.md', detail: 'Every action except Log. Without a dry-run, a new rule acts immediately — so a free rollout starts narrow and widens.' },
      { id: 'f-rate', lane: 'free', label: 'Rate limiting — 1 rule', sublabel: 'path only · per IP · 10 s window', kind: 'security', h: 56, doc: '17-waf-rate-limit-matrix.md', detail: 'The hardest constraint on the whole page: one rule, matched on path, counted per IP, over a 10-second window with a 10-second mitigation. None of the thresholds in doc 17 are expressible.' },
      { id: 'f-bot', lane: 'free', label: 'Bot Fight Mode', sublabel: 'domain-wide, not configurable', kind: 'security', h: 56, doc: '21-cloudflare-free-plan-feasibility.md', detail: 'A single computationally expensive challenge, applied to all traffic on the domain, with no per-category control and no selective skip.' },
      { id: 'f-leaked', lane: 'free', label: 'Leaked-credential detection', sublabel: 'on by default', kind: 'database', h: 52, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'f-turnstile', lane: 'free', label: 'Turnstile', sublabel: '20 widgets · unlimited challenges', kind: 'cloud', h: 52, doc: '20-cloudflare-implementation-checklist.md', detail: 'Fully available on Free, including pre-clearance and every widget type. The highest-value control a free rollout can deploy.' },
      { id: 'f-headers', lane: 'free', label: 'Transform Rules — 10', sublabel: 'security headers', kind: 'backend', h: 52, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'f-events', lane: 'free', label: 'Security Events — 24 h', sublabel: 'sampled · no export', kind: 'external', h: 52, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'f-analytics', lane: 'free', label: 'Security Analytics — 7 days', sublabel: '24 h query window', kind: 'external', h: 52, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'f-access', lane: 'free', label: 'Cloudflare Access', sublabel: 'up to 50 users · tunnels included', kind: 'security', h: 52, doc: '19-cloudflare-zero-trust.md' },
      { id: 'f-workers', lane: 'free', label: 'Workers + Durable Objects', sublabel: '100k req/day · DO on SQLite', kind: 'queue', h: 56, doc: '18-cloudflare-supabase-topology.md', detail: 'The free way to place Supabase behind the edge (Option B), and the free way to count requests precisely for the app-side rate limits.' },

      { id: 'p-managed', lane: 'pro', label: 'Cloudflare Managed Ruleset', kind: 'security', h: 52, doc: '21-cloudflare-free-plan-feasibility.md', detail: 'What doc 17 means by “managed WAF protections for common web and API attacks”.' },
      { id: 'p-owasp', lane: 'pro', label: 'OWASP Core Ruleset', kind: 'security', h: 46, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'p-rate2', lane: 'pro', label: 'Rate limiting — 2 rules', sublabel: '1 min window · host, method, UA, IP', kind: 'security', h: 56, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'p-superbot', lane: 'pro', label: 'Super Bot Fight Mode', sublabel: 'per-category actions', kind: 'security', h: 56, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'p-custom20', lane: 'pro', label: 'Custom rules — 20', kind: 'security', h: 46, doc: '21-cloudflare-free-plan-feasibility.md' },

      { id: 'b-regex', lane: 'business', label: 'Regex in custom rules', kind: 'security', h: 46, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'b-rate5', lane: 'business', label: 'Rate limiting — 5 rules', sublabel: '1 day mitigation · header + cookie counting', kind: 'security', h: 58, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'b-attack', lane: 'business', label: 'Attack score class', sublabel: 'challenge “likely_attack”', kind: 'security', h: 56, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'b-custom100', lane: 'business', label: 'Custom rules — 100', kind: 'security', h: 46, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'b-events', lane: 'business', label: 'Security Events — 3 days', kind: 'external', h: 46, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'b-analytics', lane: 'business', label: 'Security Analytics — 31 days', kind: 'external', h: 46, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'b-logpush', lane: 'business', label: 'Logpush export', kind: 'external', h: 46, doc: '10-dr-operations.md' },

      { id: 'e-expressions', lane: 'enterprise', label: 'Rate limiting — 100 rules', sublabel: 'custom counting expressions', kind: 'security', h: 56, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'e-score', lane: 'enterprise', label: 'WAF attack score 1–99', sublabel: 'exact thresholds, not just classes', kind: 'security', h: 56, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'e-ddos', lane: 'enterprise', label: '10 DDoS overrides', sublabel: 'with custom expressions', kind: 'security', h: 56, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'e-sensitive', lane: 'enterprise', label: 'Sensitive Data Detection', kind: 'security', h: 46, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'e-origin', lane: 'enterprise', label: 'Origin Rules: Host / SNI override', kind: 'security', h: 52, doc: '18-cloudflare-supabase-topology.md', detail: 'The reason a clean custom-hostname proxy in front of Supabase is an Enterprise feature rather than a configuration detail.' },
      { id: 'e-saas', lane: 'enterprise', label: 'Cloudflare for SaaS hostnames', kind: 'cloud', h: 46, doc: '18-cloudflare-supabase-topology.md' },
      { id: 'e-lists', lane: 'enterprise', label: 'Hostname / ASN lists', sublabel: '500,000 list items', kind: 'storage', h: 52, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'e-retention', lane: 'enterprise', label: 'Security Events — 30 days', kind: 'external', h: 46, doc: '10-dr-operations.md' }
    ],
    edges: [
      { id: 'ruleset-managed', from: 'f-ruleset', to: 'p-managed', label: 'broader coverage', style: 'emphasis', flow: true },
      { id: 'custom-custom', from: 'f-custom', to: 'p-custom20', label: 'more rules', style: 'dashed' },
      { id: 'rate-rate', from: 'f-rate', to: 'p-rate2', label: 'the second rule', style: 'emphasis', flow: true },
      { id: 'bot-bot', from: 'f-bot', to: 'p-superbot', label: 'configurable', style: 'emphasis' },
      { id: 'events-events', from: 'f-events', to: 'b-events', label: 'longer retention', style: 'dashed' },
      { id: 'p-rate-b', from: 'p-rate2', to: 'b-rate5', label: 'longer windows', style: 'emphasis', flow: true },
      { id: 'p-custom-b', from: 'p-custom20', to: 'b-regex', label: 'regex', style: 'dashed' },
      { id: 'b-attack-e', from: 'b-attack', to: 'e-score', label: 'thresholds', style: 'emphasis' },
      { id: 'b-rate-e', from: 'b-rate5', to: 'e-expressions', label: 'custom expressions', style: 'emphasis', flow: true },
      { id: 'b-events-e', from: 'b-events', to: 'e-retention', label: '30 days', style: 'dashed' }
    ],
    views: [
      { id: 'free', title: 'What Free actually gives you', caption: 'Enough for the perimeter basics, the identity-layer controls and internal access — and exactly one rate-limiting rule.', nodes: ['f-ddos', 'f-ruleset', 'f-custom', 'f-rate', 'f-bot', 'f-leaked', 'f-turnstile', 'f-headers', 'f-events', 'f-analytics', 'f-access', 'f-workers'] },
      { id: 'pro', title: 'What Pro adds', caption: 'The managed rulesets doc 17 assumes, a second rate-limit rule with real windows, and configurable bot categories.', nodes: ['f-ruleset', 'p-managed', 'p-owasp', 'f-rate', 'p-rate2', 'f-bot', 'p-superbot', 'p-custom20'], edges: ['ruleset-managed', 'rate-rate', 'bot-bot'] },
      { id: 'business', title: 'What Business adds', caption: 'Regex rules, longer windows, header and cookie counting, attack-score classes, and retention long enough to investigate.', nodes: ['p-rate2', 'b-rate5', 'b-regex', 'b-attack', 'b-custom100', 'b-events', 'b-analytics', 'b-logpush'], edges: ['p-rate-b', 'p-custom-b', 'events-events'] },
      { id: 'enterprise', title: 'What Enterprise adds', caption: 'The only tier that matches doc 17 as written — custom counting expressions, exact attack scores, and a clean custom hostname in front of Supabase.', nodes: ['b-attack', 'e-score', 'b-rate5', 'e-expressions', 'e-ddos', 'e-sensitive', 'e-origin', 'e-saas', 'e-lists', 'e-retention'], edges: ['b-attack-e', 'b-rate-e', 'b-events-e'] },
      { id: 'ladder', title: 'The upgrade ladder', caption: 'The three controls that actually pull a rollout upward: rate limits, managed rulesets and bot policy.', nodes: ['f-rate', 'p-rate2', 'b-rate5', 'e-expressions', 'f-ruleset', 'p-managed', 'f-bot', 'p-superbot'], edges: ['rate-rate', 'p-rate-b', 'b-rate-e', 'ruleset-managed', 'bot-bot'] }
    ],
    notes: [
      {
        title: 'How to read this',
        body: [
          'Each lane lists what that plan <em>adds</em>. Everything in the Free lane is available on every paid plan, so a column is cumulative rather than exclusive.'
        ],
        table: {
          headers: ['Requirement from v1.1', 'Free', 'Pro', 'Business', 'Enterprise'],
          rows: [
            ['Managed WAF protections', 'Free ruleset only', 'Yes', 'Yes', 'Yes'],
            ['Per-surface rate limits', '1 rule, 10 s', '2 rules, 1 min', '5 rules, 1 day', '100 rules, custom expressions'],
            ['Bot categories / bot policy', 'No', 'Super Bot Fight Mode', 'Yes', 'Yes + bot score'],
            ['Attack-score rules', 'No', 'No', 'Class only', 'Exact score'],
            ['Rule dry-run (log action)', 'No', 'No', 'No', 'Yes'],
            ['Evidence retention', '24 h events / 7 d analytics', '24 h / 7 d', '3 d / 31 d', '30 d / 90 d + Logpush'],
            ['Internal access (Access)', '≤ 50 users', '≤ 50 users', '≤ 50 users', 'Unlimited']
          ]
        }
      },
      {
        callout: true,
        tag: 'Plan choice moves the perimeter, never the boundary',
        body: [
          'Cloudflare answers whether traffic should reach the application. Supabase Auth answers who the user is. PostgreSQL RLS answers whether that user may access that row — and RLS is unaffected by the plan tier above it.',
          'A free-tier deployment loses perimeter <strong>breadth</strong>, not the <strong>boundary</strong>. Every request that reaches Postgres still meets the gate that decides tenant access.'
        ]
      },
      {
        title: 'The three constraints that decide a free rollout',
        ordered: [
          '<strong>One rate-limiting rule</strong> — path-only expression, per-IP counting, 10-second window and mitigation',
          '<strong>The Free Managed Ruleset is the only managed ruleset</strong> — Cloudflare Managed and OWASP are Pro and above',
          '<strong>No log action</strong> — there is no dry-run, so rules must start narrow and widen using Security Analytics'
        ]
      },
      {
        title: 'Upgrade triggers',
        bullets: [
          'the Free Managed Ruleset is not enough, or a second rate-limit rule is needed → <strong>Pro</strong>',
          'windows longer than a minute, header or cookie counting, attack-score classes → <strong>Business</strong>',
          'custom counting expressions, exact attack scores, or a clean custom hostname in front of Supabase → <strong>Enterprise</strong>',
          'evidence retention beyond 24 hours, or log export to a SIEM → <strong>Business</strong> (3 days) or <strong>Enterprise</strong> (30 days + Logpush)'
        ]
      },
      {
        title: 'Verified against Cloudflare’s documentation',
        body: [
          'Plan limits change, so treat every number here as a snapshot. The rate-limiting and managed-rules tables are the two pages worth re-reading before a rollout — see <code>21-cloudflare-free-plan-feasibility.md</code> for the sources.'
        ]
      }
    ]
  },

  /* --------------------------------------------------- 21 · coverage gap */
  {
    slug: 'edge-coverage-gap',
    navLabel: 'Edge coverage gap',
    kind: 'Reachability',
    accent: '--security-stroke',
    title: 'Edge coverage gap',
    lede: 'Which surfaces the edge can actually see — and the one architectural change that brings the rest back behind it.',
    description: 'Edge reachability for each surface: the Vercel-hosted application sits behind Cloudflare in Option A, Supabase API traffic bypasses the edge entirely unless a Worker gateway is introduced, and PostgreSQL remains behind RLS either way.',
    lanes: [
      { id: 'callers', label: 'Callers', w: 196 },
      { id: 'edge', label: 'Cloudflare edge — sees only proxied hostnames', w: 232 },
      { id: 'app', label: 'Vercel app (proxied)', w: 220 },
      { id: 'supabase', label: 'Supabase (direct)', w: 232 },
      { id: 'data', label: 'TB-03 · authoritative', w: 206 }
    ],
    regions: [
      { id: 'edgebox', label: 'Perimeter controls only apply to traffic that arrives here', lanes: ['edge'], kind: 'security-group' },
      { id: 'rlsbox', label: 'Never visible to the edge', lanes: ['data'], kind: 'security-group' }
    ],
    nodes: [
      { id: 'browser', lane: 'callers', label: 'Browser', kind: 'frontend', h: 46, doc: '08-clients.md' },
      { id: 'mobile', lane: 'callers', label: 'Mobile app', kind: 'frontend', h: 46, doc: '18-cloudflare-supabase-topology.md' },
      { id: 'provider', lane: 'callers', label: 'Provider webhooks', kind: 'external', h: 46, doc: '07-api-integrations.md' },
      { id: 'bots', lane: 'callers', label: 'Bots · scanners', kind: 'external', h: 46, doc: '17-waf-rate-limit-matrix.md' },

      { id: 'waf', lane: 'edge', label: 'WAF', kind: 'security', h: 44, doc: '17-waf-rate-limit-matrix.md' },
      { id: 'ratelimit', lane: 'edge', label: 'Rate limiting', kind: 'security', h: 44, doc: '17-waf-rate-limit-matrix.md', detail: 'One rule on Free, matched on path and counted per IP over a 10-second window.' },
      { id: 'botctl', lane: 'edge', label: 'Bot controls', kind: 'security', h: 44, doc: '21-cloudflare-free-plan-feasibility.md' },
      { id: 'turnstile', lane: 'edge', label: 'Turnstile', kind: 'security', h: 44, doc: '20-cloudflare-implementation-checklist.md' },
      { id: 'gateway', lane: 'edge', label: 'Worker gateway', sublabel: 'Option B · 100k req/day on Free', kind: 'queue', h: 56, doc: '18-cloudflare-supabase-topology.md', detail: 'The supported way to bring Supabase behind the edge: the Worker fetches the real project hostname, so Host and SNI are correct — which Origin Rules cannot do below Enterprise.' },

      { id: 'approutes', lane: 'app', label: 'Application routes', sublabel: '/admin/* · /public/* · sign-in pages', kind: 'frontend', h: 58, doc: '17-waf-rate-limit-matrix.md', detail: 'The only doc 17 surfaces the edge sees in Option A. The page that collects a password is app-hosted; the endpoint that receives it is not.' },

      { id: 'gotrue', lane: 'supabase', label: 'Auth / GoTrue', sublabel: '/auth/v1 · no edge control in Option A', kind: 'cloud', h: 58, doc: '02-runtime.md' },
      { id: 'postgrest', lane: 'supabase', label: 'PostgREST', sublabel: '/rest/v1/… · no edge control in Option A', kind: 'backend', h: 58, doc: '07-api-integrations.md' },
      { id: 'storage', lane: 'supabase', label: 'Storage', sublabel: '/storage/v1 · file upload and download', kind: 'storage', h: 58, doc: '04-data-model.md' },
      { id: 'fns', lane: 'supabase', label: 'Edge Functions', sublabel: '/functions/v1 · inbound webhooks', kind: 'security', h: 58, doc: '02-runtime.md', detail: 'Webhooks land here directly, so signature verification inside the function — not the perimeter — is what protects them.' },
      { id: 'realtime', lane: 'supabase', label: 'Realtime', sublabel: '/realtime/v1 · cannot be proxied cleanly', kind: 'queue', h: 58, doc: '11-architecture-gaps-and-roadmap.md', detail: 'WebSocket upgrades proxied through Workers have reported failures. EstateSync does not use Realtime yet, so this is a constraint to remember rather than a blocker — keep it on the direct hostname when it lands.' },

      { id: 'rls', lane: 'data', label: 'PostgreSQL RLS', sublabel: 'authoritative tenant boundary', kind: 'database', h: 56, doc: '03-multitenancy-security.md' },
      { id: 'constraints', lane: 'data', label: 'Constraints', sublabel: 'integrity invariants', kind: 'database', h: 56, doc: '04-data-model.md' }
    ],
    edges: [
      { id: 'browser-waf', from: 'browser', to: 'waf', label: 'proxied host', style: 'emphasis', flow: true },
      { id: 'bots-botctl', from: 'bots', to: 'botctl', label: 'automation', style: 'dashed' },
      { id: 'waf-app', from: 'waf', to: 'approutes', label: 'edge controls apply', style: 'emphasis', flow: true },
      { id: 'browser-auth', from: 'browser', to: 'gotrue', label: 'Option A · bypasses the edge', style: 'security' },
      { id: 'mobile-rest', from: 'mobile', to: 'postgrest', label: 'Option A · bypasses the edge', style: 'security' },
      { id: 'provider-fns', from: 'provider', to: 'fns', label: 'webhooks bypass edge', style: 'security' },
      { id: 'browser-gw', from: 'browser', to: 'gateway', label: 'Option B', style: 'emphasis', flow: true },
      { id: 'gw-auth', from: 'gateway', to: 'gotrue', label: 'back behind the edge', style: 'emphasis' },
      { id: 'gw-rest', from: 'gateway', to: 'postgrest', style: 'dashed' },
      { id: 'gw-storage', from: 'gateway', to: 'storage', style: 'dashed' },
      { id: 'gw-fns', from: 'gateway', to: 'fns', style: 'dashed' },
      { id: 'postgrest-rls', from: 'postgrest', to: 'rls', label: 'RLS-filtered', style: 'emphasis', flow: true },
      { id: 'fns-pg', from: 'fns', to: 'rls', label: 'service_role', style: 'security' },
      { id: 'rls-constraints', from: 'rls', to: 'constraints', style: 'emphasis' }
    ],
    views: [
      { id: 'optiona', title: 'Option A — what the edge sees', caption: 'Proxied hostnames only: the Vercel application. Everything the matrix says about API and data surfaces is unreachable from here.', nodes: ['browser', 'bots', 'waf', 'ratelimit', 'botctl', 'approutes'], edges: ['browser-waf', 'bots-botctl', 'waf-app'] },
      { id: 'bypass', title: 'What bypasses the edge', caption: 'The direct supabase-js pattern: clients, mobile and provider webhooks reach Supabase without the perimeter seeing anything.', nodes: ['browser', 'mobile', 'provider', 'gotrue', 'postgrest', 'storage', 'fns', 'realtime'], edges: ['browser-auth', 'mobile-rest', 'provider-fns'] },
      { id: 'optionb', title: 'Option B brings it back', caption: 'A Worker gateway puts Auth, REST, Storage and Functions behind the edge again. Realtime stays direct — by choice.', nodes: ['browser', 'gateway', 'gotrue', 'postgrest', 'storage', 'fns', 'realtime'], edges: ['browser-gw', 'gw-auth', 'gw-rest', 'gw-storage', 'gw-fns'] },
      { id: 'always', title: 'What the edge never sees', caption: 'Whatever the option and whatever the plan, tenant authorization is decided after the query arrives — inside Postgres.', nodes: ['postgrest', 'fns', 'rls', 'constraints'], edges: ['postgrest-rls', 'fns-pg', 'rls-constraints'] }
    ],
    notes: [
      {
        title: 'The gap in one line',
        body: [
          'In Option A the edge protects the Vercel hostname only. Supabase API traffic is protected by Supabase Auth and RLS — not by the perimeter. That is true on <strong>every</strong> plan, so it is an architecture decision rather than a tier decision, and doc 18 already provides the answer: Option B, applied selectively.'
        ]
      },
      {
        title: 'Path mapping — doc 17 surface to actual endpoint',
        body: ['The matrix in doc 17 names paths that do not exist as written, so it needs a mapping pass before anyone implements it.'],
        table: {
          headers: ['Doc 17 surface', 'Actual endpoint', 'Behind the edge in Option A'],
          rows: [
            ['/auth/login', 'Supabase Auth /auth/v1/token', 'No'],
            ['/auth/signup', 'Supabase Auth /auth/v1/signup', 'No'],
            ['/auth/reset', 'Supabase Auth /auth/v1/recover', 'No'],
            ['/api/*', 'PostgREST /rest/v1/*', 'No'],
            ['/properties/*', 'PostgREST /rest/v1/properties, /units, /leases', 'No'],
            ['/documents/*', 'Storage /storage/v1/object/*', 'No'],
            ['/payments/*', 'Payment provider, then invoices / financial_ledger', 'No'],
            ['/webhooks/*', 'Supabase Edge Functions /functions/v1/*', 'No'],
            ['/admin/*', 'Application route on Vercel', 'Yes'],
            ['/public/*', 'Application route on Vercel', 'Yes'],
            ['File upload', 'Storage /storage/v1/object/*', 'No']
          ]
        }
      },
      {
        title: 'What that means for a free rollout',
        bullets: [
          'the single rate-limiting rule belongs on the highest-value path the edge can see — or on the gateway once Option B exists',
          'the other surfaces become application-side counters: a Durable Object on the free SQLite backend is precise, not approximate',
          'Turnstile and leaked-credential detection are the real controls for authentication, and both are free',
          'webhook authenticity is decided by signature verification inside the Edge Function, not by the perimeter'
        ]
      },
      {
        callout: true,
        tag: 'Not a plan limitation',
        body: [
          'Buying a higher Cloudflare tier does not move Supabase behind the edge. Only Option B — a Worker gateway — or Supabase custom domains (with the Enterprise-only Origin Rules override) does that.',
          'What the plan buys is depth at the perimeter: more rules, longer windows, broader rulesets, longer evidence. What it never buys is visibility into rows, because that decision is made inside PostgreSQL.'
        ]
      }
    ]
  }
];

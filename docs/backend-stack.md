# Backend Stack Decision

## Decision

Descent will use Supabase as the MVP backend platform.

Chosen stack:

- Supabase Auth for account identity and session handling
- Supabase Postgres for the relational family graph
- Supabase Row Level Security for tree-scoped permissions
- Supabase Realtime for live tree, suggestion, and activity updates
- Supabase Storage for profile photos and later media attachments
- Next.js server components, route handlers, and server actions as the application layer
- TypeScript relationship and Chinese kinship logic inside the app layer, not inside database triggers

## Why This Stack

The current product constraints point to one clear MVP priority: minimize backend surface area while still getting strong relational modeling, private access control, and realtime collaboration.

Supabase fits that better than stitching together separate services because it gives the project:

- Postgres for a graph-friendly relational schema
- built-in auth that works with Next.js SSR
- row-level authorization close to the data
- first-party realtime for graph updates and activity surfaces
- storage for person photos without a separate asset service

This keeps the MVP on one backend platform instead of combining:

- a database provider
- a separate auth provider
- a separate realtime layer
- a separate storage layer

For a one-month MVP, that simplicity matters more than maximizing backend optionality.

## Recommended Architecture

### Platform

- Hosted Supabase project for MVP
- one Postgres schema in `public` for application data
- `auth.users` managed by Supabase Auth
- `public.profiles` mirrors app-facing user details

### App responsibilities

Keep these in TypeScript application code:

- tree read-model shaping for the frontend
- relationship path computation
- Chinese kinship logic
- suggestion preview generation
- AI intent parsing and confirmation workflow

Do not push those into database triggers or SQL functions early unless a query bottleneck proves it necessary.

### Data access approach

- browser client only for auth-aware reads, lightweight realtime subscriptions, and safe user actions
- server client for page loads, server actions, route handlers, and protected mutations
- service-role access only for narrow admin-only jobs if later required

### Authorization model

- membership and invite data live in Postgres
- RLS policies enforce tree membership and role checks
- app code still performs explicit role checks for UX and mutation orchestration

This gives defense in depth:

- app checks prevent bad UI paths
- database policies prevent unauthorized access if app checks are bypassed

## Why Not Other Common Options

### Firebase

Not recommended because the product model is deeply relational and path-oriented. Modeling rich family relationships, approvals, and title overrides in Postgres is more natural than forcing that structure into a document-first backend.

### Custom Node API plus standalone Postgres

Viable later, but too much surface area for MVP. It adds auth, file storage, session management, and realtime decisions that Supabase already covers.

### Prisma-first backend

Prisma is not the best first backend decision here. The harder problems are auth, permissions, invites, and realtime, not ORM ergonomics. For MVP, SQL migrations plus typed Supabase clients are the shorter path.

If the schema grows more complex later, an ORM can still be introduced without changing the platform choice.

## MVP Backend Boundaries

Backend foundation should cover now:

- environment contract
- Supabase browser and server clients
- SSR session refresh proxy
- initial SQL schema and RLS baseline
- typed database surface in the app
- family tree loader boundary between UI and persistence

Later backend milestones:

1. tree read model and real fetch path
2. membership-aware RLS policies hardened against edge cases
3. invite acceptance flow
4. mutation flows for people and relationships
5. suggestions review workflow
6. realtime subscriptions for graph and activity updates
7. storage buckets and upload policies

## Decision Consequences

This decision optimizes for MVP speed and coherence.

Tradeoffs:

- tighter coupling to Supabase auth/session patterns
- RLS policy design must be done carefully
- some business logic remains split between SQL policy rules and app-layer orchestration

Those tradeoffs are acceptable because they reduce total system count while preserving a strong relational model.

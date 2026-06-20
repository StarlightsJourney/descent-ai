# Project State

## Purpose

This file is the quick recovery point for future sessions. It captures what is currently true about the project so work can resume cleanly even if chat context is compacted.

## Current Product Direction

Descent is a private collaborative family tree for web and mobile.

Primary product goals:

- help family members understand how people are connected
- preserve lineage and family structure over time
- support collaborative editing with controlled permissions
- surface Chinese kinship titles alongside structural relationship paths
- help users remember infrequently-seen relatives through photos and personal notes

## Confirmed Product Decisions

- one private tree per family in MVP
- guests can view the full tree in MVP through invite access
- contributors can submit suggestions only
- editors and admins can directly edit
- Chinese kinship logic is required in version one
- AI should suggest changes and require user confirmation before mutating the graph
- each person node should show a photo when available, or a placeholder/avatar when not
- the selected-person panel should eventually include photo, description, and a small personal note field
- tree readability and ancestry clarity matter more than visual polish at this stage

## Current Repository State

- root git repository initialized
- GitHub remote linked:
  - `https://github.com/StarlightsJourney/descent-ai.git`
- default branch renamed to `main`

Recent commits:

- `4112506` Initial product docs and web app shell
- `63185c3` Add shadcn UI system and upgrade app shell

## Current Documentation

- [Product Brief](product-brief.md)
- [MVP Plan](mvp-plan.md)
- [Data Model](data-model.md)
- [Backend Stack Decision](backend-stack.md)
- [Supabase Setup](supabase-setup.md)

This file should be updated whenever product direction, implementation status, or near-term priorities change in a meaningful way.

## Current App Status

Web app exists in `web/` using:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui components

Current implementation includes:

- product shell for the family tree workspace
- typed family tree snapshot model
- sign-in page and sign-out action scaffold
- session-aware live-versus-demo status banner
- local `web/.env.local` filled with working Supabase values
- selector utilities for selected person, edit route, and relationship path
- client-side tree state for selection, search, zoom, fit, and pan
- graph-style visual layout with static node positioning
- selected-person details panel
- basic live relationship-derived Chinese and English labels for close seeded relatives
- avatar or placeholder presentation for person nodes and selected-person details
- selected-person description and lightweight personal note display
- ancestry-first spouse and parent-child connector rendering for the current tree canvas
- review/activity/legend panels
- AI command surface mock

## What Is Real vs Mocked

### Real

- repository structure
- product docs
- UI component system
- app shell
- Supabase auth sign-in and sign-out flow
- typed frontend data structures
- path computation from live or mock graph relationships
- interactive client-side tree state
- live Supabase tree loader with demo fallback
- hosted Supabase project configured locally
- seed data verified in the hosted Supabase project
- RLS helper fix prepared for existing and fresh Supabase projects

### Mocked

- backend mutation flows
- invites
- full auth onboarding and account creation UI
- real-time subscriptions
- approvals workflow
- AI parsing
- editable graph interactions
- exact Chinese kinship engine beyond the current simple relationship heuristics
- production tree layout logic
- person description and personal-note editing flows

## Current Verification Status

Most recent checks passed:

- `npm run lint`
- `npm run build`

Dev server is expected to run from:

- `http://127.0.0.1:3000`

## Immediate Next Priorities

1. apply the RLS helper patch in the live Supabase project so authenticated reads work without the temporary recovery path
2. verify that the web app consistently switches from demo mode to live mode after sign-in
3. add the first real mutation flow for signed-in users
4. add invite acceptance and membership flows
5. replace static node positions with a proper tree layout strategy
6. expand Chinese kinship coverage beyond the current close-family heuristics

## Current UX Notes

- person nodes now show a photo when available or an avatar placeholder when not
- seeded viewer, spouse, sibling, and child semantics have been realigned so ancestry reads more clearly in both demo and live seed data
- spouse connectors and parent-child joins now read better than the previous generic graph curves, but the overall layout is still static
- selected-person details now surface description text and a lightweight personal note, but editing those fields is still not implemented
- before major visual redesign, continue prioritizing tree meaning and mutation correctness over polish

## Supabase Setup Status

The repo now includes:

- the initial schema migration in `web/supabase/migrations/`
- a first seed script in `web/supabase/seed/`
- setup guidance in `docs/supabase-setup.md`
- `web/.env.local` created locally in the correct location

Current user-facing checkpoint:

- Supabase project exists
- auth user exists in Supabase
- `web/.env.local` contains the real project values locally
- seed data exists for the current default tree slug
- live sign-in works
- the original migration bug that referenced `public.memberships` too early is fixed
- a second migration now exists to repair the RLS helper recursion issue on already-created projects
- the immediate next user action is to run that RLS helper repair SQL in Supabase

## Backend Decision Status

Backend stack is now finalized.

Chosen direction:

- Supabase Auth for identity and session handling
- Supabase Postgres for relational family data
- Supabase Realtime for live updates
- Supabase Storage for profile photos and later media
- application-layer TypeScript for relationship logic and Chinese kinship logic

Reference:

- [Backend Stack Decision](backend-stack.md)

## Working Rules

- durable decisions belong in `docs/`, not only in chat
- implementation milestones should leave the repo in a buildable state
- before major direction changes, update the relevant docs first or alongside the code
- if chat context is lost, resume from this file and the linked docs

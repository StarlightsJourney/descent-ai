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
3. finish and verify the first real person-details mutation flow for signed-in users, including the direct-edit versus suggestion split
4. replace the current tree nodes with fixed-size identity-first cards so cards stop growing unevenly and overlapping
5. remove duplicated kinship wording so the same relationship label is not repeated in both structural and title slots
6. replace the current overlap-prone placement with a proper ancestry-first layout for spouse pairs, parent-child joins, and sibling spacing
7. introduce a derived family-unit layer so multi-partner and former-partner structures can render cleanly without forcing every branch fully open at once
8. add invite acceptance and membership flows
9. expand Chinese kinship coverage beyond the current close-family heuristics

## Current UX Notes

- person nodes now show a photo when available or an avatar placeholder when not
- seeded viewer, spouse, sibling, and child semantics have been realigned so ancestry reads more clearly in both demo and live seed data
- spouse connectors and parent-child joins now read better than the previous generic graph curves, but the overall layout is still static
- selected-person details now surface description text and a lightweight personal note, but editing those fields is still not implemented
- before major visual redesign, continue prioritizing tree meaning and mutation correctness over polish

## Agreed Next UX / Layout Direction

- keep a full-tree overview, but do not require every complex branch to be fully expanded at once
- optimize for orientation first: ancestry should remain glanceable even when partner structures are complex
- use fixed-size identity-first person cards in the tree canvas
- tree cards should emphasize avatar, name, one kinship title, and years; descriptions and personal notes belong in the selected-person panel instead of inside nodes
- remove repeated kinship wording such as showing the same relationship label twice in the same card or panel
- for simple families, continue supporting a classic tree with explicit spouse pair connectors, parent-child drops, and sibling bars
- for complex partner structures, introduce a derived family-unit abstraction rather than hard-coding one spouse pair per person
- a family unit should represent one selected partner relationship or one single-parent child group, and children should hang from that unit rather than from a raw person node
- multiple current or former partners should be represented as selectable partner groups, with status encoded visually through edge style or badges
- mobile should bias toward branch-focused exploration: one active partner branch at a time, with the broader tree remaining navigable but not fully exploded

## Next Execution Order

1. complete and verify the first person-details mutation path end to end
2. refactor tree nodes into fixed-size identity cards and remove duplicated kinship text
3. replace the current overlap-prone placement with a proper spouse-parent-sibling layout for the simple case
4. derive family units in the read model so multi-partner and former-partner cases have a stable data shape
5. add partner-stack or partner-selection UI for complex branches, especially for mobile

## Full Support Roadmap

The path from the current simple tree to fuller family-structure support should proceed in these phases:

1. `2A` relationship contract
   - define how multiple current partners, former partners, adopted children, step children, and guardian roles are represented
   - keep raw relationship edges as the source of truth, but document explicit semantics so UI code does not guess
2. `2B` derived family-unit layer
   - derive stable family units from raw people and relationship edges
   - each unit should represent one partner pair plus its child group, or one single-parent child group
3. `2C` unit-based rendering
   - switch tree connectors from raw spouse-edge heuristics to family-unit rendering
   - keep the simple married-biological-pair connector rule for simple cases, but make complex branches unit-aware
4. `2D` branch-focused navigation
   - add active partner or active family-unit selection for people with multiple branches
   - bias mobile toward one active branch at a time instead of exploding every branch at once
5. `2E` mutation and verification hardening
   - add seeded scenarios, tests, and mutation flows for multi-partner, adopted, step, and former-partner cases

## Expected Outcome After Family Units

Once the family-unit layer is in place, the expected product and implementation improvements are:

- children attach to a specific family branch rather than ambiguously to a raw person node
- multi-wife, multi-husband, and former-partner cases become renderable without rewriting the whole graph model
- adopted and step-child cases can be represented as explicit branch semantics instead of layout hacks
- desktop can preserve an overview while mobile can switch between active branches
- future mutation flows become more coherent because edits can target a family unit instead of relying on loose edge heuristics

Family units are the transition point from a graph with simple heuristics to a more structured genealogy model that can scale to real family complexity.

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

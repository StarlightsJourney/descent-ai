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
- family-unit logic must remain gender-neutral for partner and adoptive-parent cases
- unknown or intentionally hidden parents should eventually be representable as placeholder people instead of forcing a branch to disappear

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
- [Family-Unit Relationship Contract](family-unit-contract.md)
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
- local `web/.env.local` filled with working Supabase values
- selector utilities for selected person, edit route, and relationship path
- client-side tree state for selection, search, zoom, fit, and pan
- graph-style visual layout with static node positioning
- selected-person details panel
- basic live relationship-derived Chinese and English labels for close seeded relatives
- avatar-first person nodes and avatar or placeholder presentation for selected-person details
- selected-person description and lightweight personal note display
- ancestry-first spouse and parent-child connector rendering for the current tree canvas
- relationship contract documented for multi-partner, former-partner, adopted-child, step-child, and guardian cases
- additive derived family-unit layer in the snapshot and read model
- branch options and active-family-unit selection for the selected person
- full-viewport focus-mode interaction that treats branch-first view as the working mode and full-tree as an overview
- live auth state visible in the workspace top bar with sign-in and sign-out routes
- drag-to-pan, wheel zoom, and inline relative search suggestions in the workspace
- focused-mode lane-biased placement around the selected person, replacing the previous post-layout branch override that was causing stacking and connector regressions
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
- robust editable graph interactions across family units and relationship edges
- exact Chinese kinship engine beyond the current simple relationship heuristics
- production tree layout logic for dense or highly branched families
- person description and personal-note editing flows

## Current Verification Status

Most recent checks passed:

- `npm run lint`
- `npm run build`

Dev server is expected to run from:

- `http://127.0.0.1:3000`

## Immediate Next Priorities

1. finish and verify the first real person-details mutation flow for signed-in users, including the direct-edit versus suggestion split
2. replace selection-driven node reordering with stable world positions plus animated viewport travel so clicking a relative moves the camera to that person instead of swapping branch positions
3. continue hardening the focused-mode family-unit lane layout so multi-partner and mixed-parentage branches stay readable across deeper generations without stacked nodes
4. improve connector routing and anchoring for shared-parent, step, adoptive, and multi-partner cases so branches do not appear disconnected or ambiguously merged
5. unify the product visual system into a cleaner space-like theme across workspace and sign-in, including light and dark mode
6. add contextual graph actions for add, edit, hide, and delete flows around a selected person or family unit
7. connect the new family-unit layer to richer branch switching, family-unit summaries, and later mutation entry points
8. add invite acceptance and membership flows
9. expand Chinese kinship coverage beyond the current close-family heuristics

## Current UX Notes

- person nodes now show a photo when available or an avatar placeholder when not
- seeded viewer, spouse, sibling, and child semantics have been realigned so ancestry reads more clearly in both demo and live seed data
- spouse connectors and parent-child joins now read better than the previous generic graph curves, but the overall layout is still static and still depends on heuristic positioning
- selected-person details now surface description text and a lightweight personal note, but editing those fields is still not implemented
- the active workspace direction is now an interactive network with focused branch mode as the primary readable state and full-tree mode as the secondary orientation map
- branch selection is already family-unit-aware in the workspace, which is the current bridge from raw graph edges to future multi-branch editing
- focused mode no longer uses the previous direct coordinate override for selected branches; it now uses bounded neighborhood expansion plus lane-biased ordering so branch visibility is less order-dependent
- the current selection model still reflows too much around the active person, which is why switching between nearby relatives can feel like nodes are swapping places instead of the camera traveling through a stable network
- before major visual redesign, continue prioritizing tree meaning and mutation correctness over polish

## Current Interaction Direction

- treat the canvas as an interactive family network, not a permanently exploded all-branches tree
- keep focused branch mode on by default so the user works inside one readable branch around the selected person
- use full-tree mode mainly for orientation, map-like scanning, and confirming where the active branch sits in the broader family
- let family units become the branch-selection primitive for partner groups, former-partner history, and single-parent or co-parenting cases
- keep selection, branch switching, panning, minimap context, and details inspection tightly connected so navigation feels like one flow instead of separate widgets

## Known Problems

- full-tree mode still exposes the limits of the current static and heuristic layout: dense rows, shared children, and multi-partner branches can become hard to parse quickly
- the renderer now consumes family units for connectors and branch filtering, but positioning is not yet truly family-unit-native, so complex branches can still feel bolted onto a simple tree
- focused mode is now lane-biased, but the layout is still only partially family-unit-native; deeper descendants, sibling-heavy rows, and mixed partner branches still need a stronger lane-and-anchor pass
- nodes can still stack or become hard to click because lane ordering is not yet backed by true collision-aware placement
- selection motion is still not the intended interactive-network behavior: the viewport transition exists, but the graph still reads as static because node positions are being recomputed instead of treated as stable world coordinates
- connector geometry is still too heuristic in mixed family-unit cases, so some shared-parent, step-child, or adoptive branches can read as disconnected or visually merged
- branch switching exists, but the UI still needs clearer summaries of which family unit is active and why certain people are currently in or out of scope
- interaction polish is still uneven: camera behavior is slower and smoother now, but it still needs true path-follow animation, better easing, minimap feedback, branch summaries, and overview readability before it feels like a polished interactive graph
- direct-edit and suggestion flows still target person details first; family-unit-aware mutation entry points remain to be built
- placeholder-parent behavior for unknown or hidden parents is not yet implemented, even though the product needs that branch-anchor concept
- same-sex partner plus adoption cases are supported semantically by the edge model, but the renderer and mutation UX still need explicit verification and layout hardening
- contextual graph actions for add, edit, hide, and delete are not yet present in the canvas interaction model
- the current visual system still feels provisional rather than intentionally space-like, and sign-in plus workspace styling are not yet fully unified

## Agreed Next UX / Layout Direction

- keep a full-tree overview, but do not require every complex branch to be fully expanded at once
- optimize for orientation first: ancestry should remain glanceable even when partner structures are complex
- treat full-tree mode as the overview layer, not the primary editing or reading mode
- use avatar-first nodes in overview mode and only expand identity metadata where readability is preserved
- names, kinship titles, and years should stay in the focused branch view and selected-person panel instead of being forced onto every overview node
- remove repeated kinship wording such as showing the same relationship label twice in the same card or panel
- for simple families, continue supporting a classic tree with explicit spouse pair connectors, parent-child drops, and sibling bars
- for complex partner structures, introduce a derived family-unit abstraction rather than hard-coding one spouse pair per person
- a family unit should represent one selected partner relationship or one single-parent child group, and children should hang from that unit rather than from a raw person node
- multiple current or former partners should be represented as selectable partner groups, with status encoded visually through edge style or badges
- mobile should bias toward branch-focused exploration: one active partner branch at a time, with the broader tree remaining navigable but not fully exploded

## Intended Next Graph Iteration

- keep node positions stable in world space once laid out; do not swap nearby relatives when selection changes
- treat selection as a camera problem first: animate pan and zoom to the target person and preserve local spatial memory
- keep generations broadly directional with ancestors above and descendants below, but use family-unit lane anchors and collision avoidance so partner branches do not stack into one lane
- move toward avatar-first graph nodes plus edge-first interaction polish, with details opening in a side panel instead of inside the graph itself
- add animated path emphasis on selection changes so the route to the new focus person becomes visually legible
- represent partner relationships through explicit family-unit junctions or partnership anchors rather than relying on direct person-to-person spouse lines when branches become complex
- style deceased people with a quieter, lower-contrast treatment so they remain readable without competing with active selection glow or navigation effects

## Concrete Graph UX Rules To Preserve

- clicking a person should move the viewport through the existing connection path toward that person; the graph should feel like the camera is traveling through a network, not like nodes are teleporting around
- selection travel should use staggered pulse or glow packets that move along the same connector geometry already drawn on the canvas
- selected-person emphasis should come from travel glow, edge emphasis, and a clean destination state, not from reshuffling nearby nodes
- hover states should make nodes feel alive and interactive, but the motion should remain subtle enough that the graph still reads as an ancestry structure rather than a free-floating particle system
- extended family branches should avoid overlap by giving each partner branch its own anchor and child drop line; children should hang from the relevant partner unit, not from a generic midpoint of all nearby adults
- when a person has no known parents in the mapped data, treat that as an incomplete lineage boundary rather than a broken graph

Reference patterns to study for future iterations:

- React Flow documents animated viewport helpers like `setCenter`, `setViewport`, and `fitView` with `duration`, `ease`, and smooth interpolation, and also exposes examples for node position animation, animated edges, force layout, and node collisions
- Cytoscape.js documents `cy.animate()` for viewport pan/zoom and fitting to chosen elements, which matches the "camera moves to the node" behavior more closely than reflowing the layout on every click
- vis-network documents `focus(nodeId, options)` and `moveTo(options)` for animated camera focus with draggable interruption, which is close to the intended interaction model for the family graph
- D3 force layouts remain relevant mainly for collision resolution and organic spacing, not for the ancestry semantics themselves

## Current Best-Fit Layout Direction For Complex Families

- simple cases can still render with direct spouse and parent-child connectors
- once a person has multiple partners or blended-family branches, introduce explicit partnership or family-unit anchors as the connector source for shared children
- each partner branch should own its own vertical drop for children and its own ancestry rise for that partner's parents
- the selected person may stay visually central in focused mode, but branch members should keep stable relative ordering so moving between adjacent relatives feels like camera travel rather than branch swapping

## Next Execution Order

1. complete and verify the first person-details mutation path end to end
2. finish the branch-focused interactive-network controls around focused mode, active family-unit switching, and readable branch summaries
3. refactor tree nodes into fixed-size identity cards and remove duplicated kinship text
4. replace the current overlap-prone placement with a proper spouse-parent-sibling and family-unit-aware layout
5. add family-unit-aware mutation entry points and stronger partner-stack or partner-selection UI for complex branches, especially on mobile

Focused-mode layout likely needs a `family-unit lane` pass before any broader full-tree renderer rewrite:

- visible family units should own stable anchors and horizontal lanes
- children should drop from a unit anchor instead of an averaged parent midpoint
- alternate current or former partner branches should occupy separate sibling lanes around the selected person

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

## Family-Unit Roadmap Status

- `2A` is now documented in [Family-Unit Relationship Contract](family-unit-contract.md)
- `2B` is now present in demo data, live read-model snapshots, and shared frontend types as an additive derived family-unit layer beside raw relationships
- `2C` has partially started because workspace filtering and connector grouping already read from family units, but layout and interaction still need to become fully family-unit-native

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
- live auth state is visible in the workspace shell
- live tree data has been confirmed from the workspace instead of the demo fallback
- the original migration bug that referenced `public.memberships` too early is fixed
- a second migration now exists to repair the RLS helper recursion issue on already-created projects
- the RLS helper repair SQL has already been run for the current project

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

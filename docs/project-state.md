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

## Confirmed Product Decisions

- one private tree per family in MVP
- guests can view the full tree in MVP through invite access
- contributors can submit suggestions only
- editors and admins can directly edit
- Chinese kinship logic is required in version one
- AI should suggest changes and require user confirmation before mutating the graph

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
- mock people and relationships data
- selector utilities for selected person, edit route, and relationship path
- client-side tree state for selection, search, zoom, fit, and pan
- graph-style visual layout with static node positioning
- selected-person details panel
- Chinese title and English explanation display
- review/activity/legend panels
- AI command surface mock

## What Is Real vs Mocked

### Real

- repository structure
- product docs
- UI component system
- app shell
- typed frontend data structures
- path computation from mock graph relationships
- interactive client-side tree state

### Mocked

- backend persistence
- authentication
- invites
- real-time sync
- approvals workflow
- AI parsing
- editable graph interactions
- exact Chinese kinship engine
- production tree layout logic

## Current Verification Status

Most recent checks passed:

- `npm run lint`
- `npm run build`

Dev server is expected to run from:

- `http://127.0.0.1:3000`

## Immediate Next Priorities

1. replace demo snapshot data with a real app state layer
2. define backend contract for people, relationships, suggestions, and title overrides
3. decide data source strategy for auth, storage, and realtime
4. replace static node positions with a proper tree layout strategy
5. improve the visual system further only after state and data flow are real

## Working Rules

- durable decisions belong in `docs/`, not only in chat
- implementation milestones should leave the repo in a buildable state
- before major direction changes, update the relevant docs first or alongside the code
- if chat context is lost, resume from this file and the linked docs

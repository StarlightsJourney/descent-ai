# MVP Plan

## MVP Goal

Build a usable first version in one month that lets a private family group browse, search, and maintain a shared family tree with controlled collaboration.

## Strict MVP Scope

### Included

- Private family tree workspace
- Account-based member access
- Guest read-only invite access
- Role-based permissions: guest, contributor, editor, admin
- Contributors can submit suggestions only
- Editors and admins can directly edit
- Interactive tree view with pan and zoom
- Search by person name
- Person profile view
- Manual add/edit person flow
- Manual add/edit relationship flow
- Support for biological and marriage relationships in the UI
- Basic support for divorce, adoption, and step relationships in schema
- Relationship path from current user to selected person
- Chinese kinship title plus English explanation for common supported cases
- Manual title correction path
- Real-time updates for tree changes
- Basic activity history

### Deferred

- Payments
- Public discovery
- Multiple family trees per user
- Advanced field-level privacy
- Media galleries and story timelines
- Social feed
- Offline editing
- AI autonomous editing
- Complex rollback tooling
- Explicit support for highly unusual relationship edge cases

## Recommended MVP Screens

1. Sign in / Join via invite
2. Main tree view
3. Person profile panel or page
4. Add person form
5. Edit person form
6. Add relationship form
7. Members and invites
8. Activity log
9. Settings

## Main Tree View Requirements

- full-screen graph-first layout
- search entry at top
- zoom controls
- center-on-me control
- selected-person side panel on web
- bottom sheet or full page profile on mobile
- overview or mini-map if time allows

## Mobile MVP Recommendation

For month one, mobile should prioritize:

- browse tree
- search people
- view profiles
- perform simple edits

Target full mobile editing if feasible, but if time becomes tight, reduce mobile editing before reducing web core functionality.

## One-Month Delivery Plan

### Week 1: Foundations

- Finalize schema and permissions
- Set up repo and app architecture
- Implement auth and private tree membership
- Create seed data structure for tree rendering

### Week 2: Core Tree Experience

- Build interactive tree rendering
- Add person selection and profile panel
- Add search and jump-to-person
- Establish relationship storage and graph queries

### Week 3: Editing and Collaboration

- Add person create/edit flows
- Add relationship create/edit flows
- Implement roles and permissions
- Add suggestion workflow for contributors
- Add real-time updates
- Add activity history

### Week 4: Hardening and MVP Close

- Improve visual distinction for relationship types
- Add guest invite flow
- Add relationship path to selected person
- Add Chinese kinship title output and manual correction flow for common cases
- Test large family datasets
- Fix performance and mobile usability issues
- Prepare MVP demo data and docs

## Suggested Release Standard

The MVP is ready when:

- a family can be invited into one private tree
- members can find a person quickly
- members can understand basic connections
- members can see a Chinese kinship title for common relationships and correct it when needed
- authorized users can safely update the tree
- guests can browse without editing
- changes sync in real time

## Post-MVP Priorities

1. Chinese kinship titles and manual title overrides
2. broader Chinese kinship coverage for harder edge cases
3. AI command bar with confirmation workflow
4. richer visual relationship styles
5. version history and rollback
6. more advanced privacy controls
7. linked or multi-tree support if the product direction requires it

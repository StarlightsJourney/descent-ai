# Descent

Initial product planning documents for a private collaborative family tree application.

## Documents

- [Project State](docs/project-state.md)
- [Product Brief](docs/product-brief.md)
- [MVP Plan](docs/mvp-plan.md)
- [Data Model](docs/data-model.md)
- [Backend Stack Decision](docs/backend-stack.md)
- [Supabase Setup](docs/supabase-setup.md)

## Repository Layout

- `docs/`: product and planning documents
- `web/`: Next.js web application scaffold

## Current Direction

Descent is a private family tree product for web and mobile. Its purpose is to help family members understand how people are connected, preserve lineage, and collaboratively maintain the family record over time.

## Current Status

- Product docs are defined in `docs/`
- A local and GitHub-backed repository is set up
- The backend stack is now chosen: Supabase
- The web app has an interactive frontend shell with:
  - typed family tree data
  - client-side selection state
  - search-driven focus
  - zoom, fit, center, and pan controls
- Supabase schema, RLS, and the first live tree read path are scaffolded

## Descent Web

This app is the current web shell for Descent, a private collaborative family tree.

## Backend Foundation

The backend decision for MVP is Supabase:

- Supabase Auth
- Supabase Postgres
- Supabase Realtime
- Supabase Storage

The initial foundation in this app includes:

- SSR-safe Supabase browser and server clients
- Next.js `proxy.ts` session refresh hook
- typed database surface in `src/lib/database.types.ts`
- initial SQL schema in `supabase/migrations/20260619_initial_schema.sql`
- first seed script in `supabase/seed/initial-demo-tree.sql`
- a tree loader boundary that now reads from Supabase when auth and seeded data exist, with demo fallback otherwise
- a sign-in page, sign-out action, and session-aware live-versus-demo status banner

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
DEFAULT_TREE_SLUG=
```

Without Supabase env configured, or when the signed-in user has no active seeded membership, the app falls back to the demo tree snapshot.

## Next Steps

1. Apply the SQL migration to a Supabase project.
2. Create one auth user, then run `supabase/seed/initial-demo-tree.sql` with your email and slug values.
3. Add invite acceptance and mutation flows.
4. Replace placeholder title/path presentation with the real kinship engine.

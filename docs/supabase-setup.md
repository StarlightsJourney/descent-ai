# Supabase Setup

## Purpose

This document is the fastest path to get Descent rendering from a real Supabase project instead of the demo snapshot.

## Setup Flow

1. Create a Supabase project.
2. Apply the initial schema from `web/supabase/migrations/20260619_initial_schema.sql`.
3. Create one auth user by signing up through Supabase Auth or the dashboard.
4. Run `web/supabase/seed/initial-demo-tree.sql` after replacing its placeholder values.
5. Set the web app env vars to point at that project.
6. Sign in as the seeded user.
7. If the project was created before the RLS helper fix, run `web/supabase/migrations/20260619_rls_helper_security_definer.sql`.

## Current Session Checkpoint

At the current checkpoint:

- the Supabase auth user has already been created
- `web/.env.local` is filled locally with the real project values
- the seed has already been verified for the working tree slug
- the sign-in flow is working
- one remaining hosted-database repair step exists for RLS helper functions on already-created projects

The next actions should be:

1. Run `web/supabase/migrations/20260619_rls_helper_security_definer.sql` in the Supabase SQL editor for the current project.
2. Refresh the app while signed in.
3. Confirm that the home page now reads live tree data instead of the demo fallback.

## Important Migration Note

An earlier version of the migration failed because helper functions referenced `public.memberships` before that table existed.

That ordering bug is already fixed in:

- `web/supabase/migrations/20260619_initial_schema.sql`

If the earlier failed run left a partially initialized project, the safest path is to use a fresh Supabase project before rerunning the fixed migration.

## RLS Helper Repair

The current schema uses RLS policies that depend on helper functions:

- `public.is_tree_member(uuid)`
- `public.has_tree_role(uuid, public.tree_role[])`

Those helpers query `public.memberships`, which is itself protected by RLS. Existing projects created before the repair can therefore authenticate successfully but still fail normal membership-backed reads.

For already-created projects, run:

- `web/supabase/migrations/20260619_rls_helper_security_definer.sql`

That repair migration:

- recreates both helpers as `security definer`
- locks their `search_path`
- grants execute only to authenticated users

Fresh projects created from the current `20260619_initial_schema.sql` already include this fix.

## Required Environment

Set these in `web/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `DEFAULT_TREE_SLUG`

`DEFAULT_TREE_SLUG` should match the slug used in the seed SQL.

## Important Seed Assumptions

The seed script expects:

- the schema migration has already been applied
- the target user already exists in `auth.users`
- the profile trigger has already created `public.profiles`

The script does not create the auth user for you. Create that user first, then use the same email in the seed file.

## Minimum Successful Result

After the seed runs successfully, the project should contain:

- one family tree
- one admin membership linked to a person node
- several people
- relationship edges
- a few suggestions
- a few activity log rows

At that point, the existing web shell should render Supabase-backed data for that signed-in user.

## Current UI Limitations

Even with live data working:

- the current graph layout is still static and not a full genealogy layout engine
- the live tree currently derives only simple relationship labels for close relatives
- the exact Chinese kinship engine is not finished yet
- live nodes do not yet show photos/placeholders in the intended final form
- selected-person details do not yet include the intended description/personal-note experience

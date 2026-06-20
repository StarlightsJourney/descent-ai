# Data Model

## Purpose

This document defines the initial entities needed for the private collaborative family tree MVP.

## Core Entities

### User

Represents an authenticated person using the app.

Implementation note:

- authentication identity should come from `auth.users` in Supabase
- app-facing profile data should live in a `public.profiles` table keyed to `auth.users.id`

Suggested fields:

- `id`
- `email`
- `display_name`
- `avatar_url`
- `preferred_language`
- `created_at`
- `updated_at`

### FamilyTree

Represents one private family space.

Suggested fields:

- `id`
- `name`
- `slug`
- `description`
- `created_by_user_id`
- `created_at`
- `updated_at`

### Membership

Connects a user to a family tree with a role.

Suggested fields:

- `id`
- `family_tree_id`
- `user_id`
- `person_id`
- `role` (`contributor`, `editor`, `admin`)
- `status` (`active`, `invited`, `disabled`)
- `created_at`
- `updated_at`

Notes:

- `person_id` should be nullable because some members may help administer a tree before their own person node is linked
- the user-to-person mapping should be tree-scoped, not global, because the same user could theoretically appear in different trees later

### Invite

Allows guest or member entry into the tree.

Suggested fields:

- `id`
- `family_tree_id`
- `token`
- `invite_type` (`guest`, `member`)
- `intended_role` (`guest`, `contributor`, `editor`)
- `expires_at`
- `created_by_user_id`
- `created_at`

### Person

Represents one person node in the family tree.

Suggested fields:

- `id`
- `family_tree_id`
- `primary_name`
- `alternative_names_json`
- `gender`
- `birth_date`
- `death_date`
- `is_living`
- `photo_url`
- `bio`
- `generation_index`
- `birth_place`
- `current_place`
- `created_by_user_id`
- `created_at`
- `updated_at`

Notes:

- `alternative_names_json` can later store Chinese names, nicknames, romanization, and aliases
- optional fields should remain optional in MVP

### Relationship

Represents a typed edge between two people.

Suggested fields:

- `id`
- `family_tree_id`
- `from_person_id`
- `to_person_id`
- `relationship_type`
- `status`
- `metadata_json`
- `start_date`
- `end_date`
- `created_by_user_id`
- `created_at`
- `updated_at`

Recommended `relationship_type` values:

- `biological_parent`
- `adoptive_parent`
- `step_parent`
- `guardian`
- `spouse`

Recommended `status` values:

- `active`
- `divorced`
- `separated`
- `inactive`

Notes:

- Parent-child edges are more robust than storing fixed mother/father columns
- `metadata_json` can later store visual overrides or cultural labels
- marriage and divorce are better handled as relationship records than person flags

### PersonTitleOverride

Optional future-ready table for manually overriding relationship titles.

Suggested fields:

- `id`
- `family_tree_id`
- `viewer_person_id`
- `target_person_id`
- `locale`
- `title_text`
- `explanation_text`
- `created_by_user_id`
- `created_at`

This is part of version one to support Chinese title correction without changing graph structure.

### SuggestedEdit

Represents a contributor-submitted suggestion that requires editor or admin review.

Suggested fields:

- `id`
- `family_tree_id`
- `proposed_by_user_id`
- `target_entity_type`
- `target_entity_id`
- `action_type`
- `proposed_change_json`
- `status` (`pending`, `approved`, `rejected`)
- `reviewed_by_user_id`
- `review_notes`
- `created_at`
- `reviewed_at`

### ActivityLog

Tracks important changes for auditing and recovery.

Suggested fields:

- `id`
- `family_tree_id`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `action`
- `summary`
- `before_json`
- `after_json`
- `created_at`

## Permissions Model

### Guest
- no account
- read-only via invite token
- full tree visibility in MVP

### Contributor
- account required
- can propose additions or edits

### Editor
- account required
- can directly edit data

### Admin
- account required
- can edit and manage access
- inherits editor capabilities

## Key Relationships Between Entities

- A `FamilyTree` has many `Memberships`
- A `FamilyTree` has many `People`
- A `FamilyTree` has many `Relationships`
- A `User` can belong to one or more `FamilyTree` records, even if MVP UI focuses on one
- A `Person` belongs to exactly one `FamilyTree` in MVP
- A `Relationship` links two `Person` records in the same tree

## Important Modeling Decisions

### One tree per family in MVP

The product experience assumes one private tree per family. The backend can still allow a user to appear in multiple trees later if product direction changes.

### Graph model over rigid family columns

This app should use a graph-style relationship model rather than hard-coded `father_id`, `mother_id`, `spouse_id` fields. Real family structures are too varied for rigid columns.

### Store enough data for future relationship intelligence

Even if MVP only shows a connection path, the schema should support future computation of:

- Chinese kinship titles
- English relationship explanations
- title overrides
- visual relationship variants

Version one should implement common-case Chinese kinship titles rather than leaving the feature entirely for later.

### History matters

Because family edits are sensitive, change history should be stored from the start. Full rollback UI can wait, but the audit data should not.

## Recommended API Surface

### Auth and access

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /invites/:token/accept`

### Tree

- `GET /trees/:id`
- `GET /trees/:id/activity`
- `GET /trees/:id/members`
- `POST /trees/:id/invites`

### People

- `GET /people/:id`
- `POST /people`
- `PATCH /people/:id`

### Relationships

- `POST /relationships`
- `PATCH /relationships/:id`
- `DELETE /relationships/:id`

### Search

- `GET /trees/:id/search?q=`

### Relationship understanding

- `GET /people/:id/path-to-me`
- `GET /people/:id/title-to-me`

### Suggestions

- `GET /trees/:id/suggestions`
- `POST /suggestions`
- `PATCH /suggestions/:id`

## Implementation Notes

The current frontend already assumes this model shape conceptually, even though data is still mocked. In practice, the next backend pass should expose a tree read model that can hydrate:

- current viewer identity
- selected person details
- people and relationship graph data
- suggestions
- activity feed
- stats

The next technical decision is not the entity model itself. That is mostly established. The next decision is which backend stack will implement this model for MVP, especially for:

- auth
- relational persistence
- realtime updates
- file storage

That decision is now made:

- Supabase Auth
- Supabase Postgres
- Supabase Realtime
- Supabase Storage

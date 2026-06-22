# Family-Unit Relationship Contract

## Purpose

This document formalizes the raw relationship semantics required before deriving family units for rendering and mutation flows.

The source of truth remains the `people` table plus directed `relationships` edges. Family units are a derived read-model layer built from those edges.

## Scope

This contract covers:

- multiple current partners
- former partners
- same-sex partner units
- adopted children
- step children
- guardian relationships
- unknown or intentionally hidden parents represented through placeholders

It is intentionally limited to the MVP family-unit roadmap. It does not attempt to model every historical or legal nuance.

## Raw Relationship Edge Contract

### Shared rules

- every relationship row belongs to exactly one tree
- `from_person_id` and `to_person_id` must refer to people in the same tree
- UI and read-model code must treat the stored edge type as authoritative and must not guess a stronger relationship type from layout
- `metadata_json` may carry future labels or provenance, but Phase 2A semantics must remain valid even when `metadata_json` is null

### `spouse`

Semantic meaning:

- one partner relationship between two adults
- used for current and former partner pairings
- treated as logically undirected even though it is stored with `from_person_id` and `to_person_id`

Rules:

- only one canonical active partner edge should exist per unordered pair
- the read model must normalize partner pairs by unordered person ids, not by edge direction
- a person may have multiple spouse edges across the same lifetime
- multiple `active` spouse edges for the same person are allowed because the product must support multi-partner structures
- partner semantics are gender-neutral; the same spouse edge and family-unit derivation rules apply to woman-woman, man-man, and man-woman partner pairs

Status interpretation:

- `active`: current partner branch
- `divorced`: former partner branch with explicit end of marriage or partnership
- `separated`: former or transitional partner branch that should still remain distinct from active
- `inactive`: hidden or deprecated partner edge that should not drive active branch presentation

### Parent-to-child edges

Parent-like edges are directional and always point from caregiver to child.

#### `biological_parent`

- primary parentage edge
- establishes biological lineage
- participates in family-unit child placement

#### `adoptive_parent`

- primary parentage edge
- establishes adoptive parentage with the same placement weight as biological parentage
- participates in family-unit child placement

#### `guardian`

- primary caregiving edge for MVP family-unit derivation
- used when the adult is a guardian or caretaker without biological or adoptive parentage
- participates in family-unit child placement

#### `step_parent`

- non-primary parentage edge
- used only when the adult is recognized as a step-parent to the child
- must not replace a biological, adoptive, or guardian edge
- must not be inferred merely because a parent has a spouse

Derivation rule:

- `step_parent` can attach a child to a partner unit only when the child already has a primary parent edge to the other partner in that unit
- `step_parent` alone must not create the child's base parent set

## Derivation Semantics For Phase 2B

### Unknown or hidden parents

Some trees will know that a parent node exists but will not know who that person is, or will intentionally keep that identity hidden.

Phase 2B should therefore allow a child branch to remain structurally anchored even when a concrete parent identity is missing.

Rules:

- if a caregiver slot is known to exist but the person identity is unknown, the tree may use a placeholder person node rather than dropping the branch entirely
- placeholder parents should behave like normal people for layout and branch anchoring, but they should be clearly marked in later UI work as unknown or hidden
- if no parent is known at all, the child may remain on a single-parent or unresolved branch without forcing a fake second parent
- placeholder parent support is a product and mutation requirement even if the first renderer pass still uses concrete demo identities

### Primary parent set

For family-unit derivation, the primary parent set for a child is the set of non-`inactive` incoming edges with type:

- `biological_parent`
- `adoptive_parent`
- `guardian`

`step_parent` is excluded from the primary parent set.

### Partner unit

A derived partner unit is anchored on one normalized spouse edge.

A partner unit may exist even if the pair has no attached children yet.

A child belongs to a partner unit when:

- both partners are in the child's primary parent set, or
- one partner is in the child's primary parent set and the other partner has an explicit `step_parent` edge to that child

A child does not belong to a partner unit just because one primary parent has that partner.

### Former-partner unit

A former-partner unit is still a partner unit. Its distinguishing feature is the normalized spouse status:

- `divorced` or `separated` means the unit remains derivable and renderable as a former branch
- shared children stay attached to that former-partner unit

### Single-parent unit

A derived single-parent unit exists when a child has one primary parent and no qualifying partner unit owns that child placement.

### Co-parenting fallback

When a child has multiple primary parents but no spouse edge joins the relevant adults, derivation should produce a co-parenting fallback unit rather than silently dropping the child.

This is a read-model safety valve, not the preferred authoring shape.

## Relationship Invariants

- spouse direction is storage-only and must not affect semantics
- parent edges are directional and their direction is semantically meaningful
- `divorced` and `separated` are partner statuses, not lineage removals
- inactive parent edges should not drive active family-unit placement
- a child may appear in more than one derived unit across different branch meanings, such as:
  - former-partner shared-child unit
  - current partner step-child unit
- UI code must distinguish:
  - primary child membership
  - explicit step-child membership
  - partner status

## Normalized Family-Unit Shape

Phase 2B should derive units with these minimum semantics:

- unit kind: `partner`, `single_parent`, or `co_parenting`
- unit status: `active`, `former`, or `inactive`
- normalized parent ids
- optional backing spouse relationship id
- ordered child entries
- per-child parent links inside the unit
- per-child classification showing whether the unit sees that child as biological, adoptive, guardian, step, or mixed
- per-child record of primary parents that exist outside the unit, if any

## Examples

### Multiple current partners

- Person A may have `active` spouse edges to Person B and Person C
- derivation creates two partner units: `A+B` and `A+C`
- children attach only to the unit whose edges explicitly support that branch

### Former partner with shared children

- Person A and Person B have spouse status `divorced`
- child X has incoming primary parent edges from A and B
- derivation keeps child X on the `A+B` former-partner unit

### Adopted child

- child X has incoming `adoptive_parent` edges from A and B
- child X belongs to the `A+B` partner unit and is classified as `adopted`
- this rule is the same regardless of whether A and B are opposite-sex or same-sex partners

### Step child

- child X has `biological_parent` from A
- A has an `active` spouse edge to B
- child X has explicit `step_parent` from B
- child X belongs to the `A+B` partner unit and is classified as `step`
- if the `step_parent` edge from B is absent, child X stays on A's single-parent or other primary-parent unit

### Guardian case

- child X has incoming `guardian` edges from A and B
- child X belongs to the relevant partner or co-parenting unit and is classified as `guardian`

### Same-sex partner with adopted child

- child X has incoming `adoptive_parent` edges from A and B
- A and B have an `active` spouse edge
- derivation produces the same partner unit and child placement shape as any other adoptive-parent pair
- neither layout nor mutation logic should assume a mother-father split in order to render that branch correctly

## Mutation Guidance

- create or edit flows must write explicit `step_parent` edges for step-child semantics
- create or edit flows must preserve former spouse edges instead of deleting them when shared-child history still matters
- direct-edit and suggestion flows should target raw relationship edges first; later UX can target a derived family unit that translates back into edge mutations

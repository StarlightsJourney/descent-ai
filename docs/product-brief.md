# Product Brief

## Product Summary

Descent is a private, collaborative family tree for web and mobile that helps family members explore lineage, understand how people are connected, and maintain an accurate shared family record over time.

## Core User Problem

Large and complicated families are difficult to remember and navigate. Users may not know:

- who a person is
- how they are connected
- which branch they belong to
- what title they should use for that relative

The product should reduce that confusion and make the family structure understandable at a glance.

## Primary Users

- Family members inside a private tree
- Extended relatives invited to browse or contribute

## Secondary Users

- Family historians or organizers acting as admins
- Guests with read-only invite access

## Product Goals

- Make the family tree easy to explore visually
- Let users identify people and relationship paths quickly
- Support real family complexity without making the graph unreadable
- Allow collaborative updates with controlled permissions
- Preserve data integrity through approval and history

## Product Principles

- Private by default
- Accurate before clever
- Visual clarity over raw density
- Manual editing is the source of truth
- AI assists but does not silently change the tree

## Core Experience

The main screen is an interactive tree where users can:

- pan across the tree freely within the graph bounds
- zoom in and out smoothly
- zoom out to understand the full scale of the family
- search for a person and jump to them
- select a person to inspect their profile and relationships
- understand how that person connects back to themselves

## Family Structure Support

The initial product should support these relationship types in the data model:

- biological parent-child
- spouse / marriage
- divorce / separation
- adopted child
- step-parent / step-child
- guardian / caretaker

Some of these can be visually simplified in the first release, but the schema should support them from the start.

## Permissions Model

### Guest
- No account required
- Read-only access through invite link
- Can view the full tree in MVP unless a later privacy rule restricts it

### Contributor
- Account required
- Can suggest additions or edits
- Cannot directly modify the tree

### Editor
- Account required
- Can directly edit the tree

### Admin
- Account required
- Can edit
- Can manage roles, invites, and approvals

Admins are expected to inherit editor capabilities.

## Editing Model

Manual editing should be the default workflow in MVP. AI should be introduced only as a guided assistant.

Recommended AI interaction:

- user types an intent in natural language
- system parses it into a proposed person or relationship change
- UI shows a preview of the suggested change
- user or admin confirms it
- only then is the graph updated

Example:

`Add Sarah Lim as daughter of David Lim and Mei Tan`

The system should prefill the intended action rather than commit it automatically.

## Relationship Understanding

There are two layers of relationship explanation:

1. Structural path:
   `You -> Father -> Grandfather -> Great-Grandfather -> Person`
2. Human-readable title:
   `grandfather's younger brother`, `great-grandmother`, etc.

For this product, Chinese kinship terms are important. The product should eventually support:

- Chinese title
- English explanation
- optional manual override when the automatic title is wrong

For version one, Chinese kinship logic is a required feature. The first release should provide:

- a structural path from the current user to the selected person
- a Chinese kinship title where the system can determine one reliably
- an English explanation alongside the Chinese title
- a manual override path when the generated title is wrong

If the exact title engine cannot cover every edge case in version one, the UI should still surface the path and allow correction instead of hiding the result entirely.

## Visual Language

The tree should visually distinguish different relationship types. Early guidance:

- solid line for biological lineage
- distinct style for marriage
- dotted or broken line for divorced, separated, or indirect relationships
- muted or alternate treatment for non-blood relationships

Theme support should include at least:

- light mode
- dark mode

## Privacy Expectations

- Tree is private by default
- Guests may view only through explicit invite access
- Guest access can view the full tree in MVP
- Editing always requires an account
- Sensitive person details may need per-field visibility controls later

## Future Product Directions

Not part of MVP, but aligned with the vision:

- AI-assisted data entry
- version history and tree rollback tools
- branch-specific editing permissions
- multiple linked trees
- social layer around family activity
- monetization for broader or premium usage

## Open Product Decisions

- Whether certain profile fields should be private per person
- Whether guest links can be restricted to certain branches or people later
- How broad the first Chinese kinship title coverage must be beyond the most common cases
- Whether mobile version one reaches full editing or lands on light editing first

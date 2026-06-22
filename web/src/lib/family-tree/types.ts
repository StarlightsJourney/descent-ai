export type ViewerRole = "guest" | "contributor" | "editor" | "admin";

export type PersonAccent = "blood" | "marriage" | "step";

export type RelationshipStyle = "blood" | "marriage" | "indirect";

export type RelationshipType =
  | "biological_parent"
  | "adoptive_parent"
  | "step_parent"
  | "guardian"
  | "spouse";

export type RelationshipStatus = "active" | "divorced" | "separated" | "inactive";

export type FamilyUnitKind = "partner" | "single_parent" | "co_parenting";

export type FamilyUnitStatus = "active" | "former" | "inactive";

export type Person = {
  id: string;
  primaryName: string;
  chineseTitle: string;
  englishTitle: string;
  relationLabel: string;
  branch: string;
  years: string;
  photoUrl: string | null;
  avatarLabel: string;
  description: string;
  personalNote: string;
  x: number;
  y: number;
  accent: PersonAccent;
};

export type Relationship = {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  type: RelationshipType;
  status: RelationshipStatus;
  style: RelationshipStyle;
};

export type FamilyUnitParentLink = {
  relationshipId: string;
  parentId: string;
  type: Exclude<RelationshipType, "spouse">;
  status: RelationshipStatus;
  isPrimary: boolean;
};

export type FamilyUnitChild = {
  childId: string;
  role: "biological" | "adopted" | "guardian" | "step" | "mixed";
  parentLinks: FamilyUnitParentLink[];
  outsidePrimaryParentIds: string[];
};

export type FamilyUnit = {
  id: string;
  kind: FamilyUnitKind;
  status: FamilyUnitStatus;
  partnerRelationshipId: string | null;
  parentIds: string[];
  children: FamilyUnitChild[];
};

export type Suggestion = {
  id: string;
  label: string;
  status: "pending" | "approved";
};

export type ActivityEntry = {
  id: string;
  summary: string;
  occurredAtLabel: string;
};

export type TreeStats = {
  peopleCount: number;
  pendingSuggestionCount: number;
  editorCount: number;
  liveSync: boolean;
};

export type FamilyTreeSnapshot = {
  id: string;
  name: string;
  description: string;
  currentViewerPersonId: string;
  selectedPersonId: string;
  viewerRole: ViewerRole;
  people: Person[];
  relationships: Relationship[];
  familyUnits: FamilyUnit[];
  suggestions: Suggestion[];
  activity: ActivityEntry[];
  stats: TreeStats;
};

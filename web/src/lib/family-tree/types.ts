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

export type Person = {
  id: string;
  primaryName: string;
  chineseTitle: string;
  englishTitle: string;
  branch: string;
  years: string;
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
  suggestions: Suggestion[];
  activity: ActivityEntry[];
  stats: TreeStats;
};

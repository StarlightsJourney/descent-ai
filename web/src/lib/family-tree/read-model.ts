import type { Database } from "@/lib/database.types";
import type {
  ActivityEntry,
  FamilyTreeSnapshot,
  Person,
  PersonAccent,
  Relationship,
  RelationshipStyle,
  ViewerRole,
} from "@/lib/family-tree/types";

type MembershipRow = Database["public"]["Tables"]["memberships"]["Row"];
type FamilyTreeRow = Database["public"]["Tables"]["family_trees"]["Row"];
type PersonRow = Database["public"]["Tables"]["people"]["Row"];
type RelationshipRow = Database["public"]["Tables"]["relationships"]["Row"];
type SuggestedEditRow = Database["public"]["Tables"]["suggested_edits"]["Row"];
type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];

const COLUMN_WIDTH = 250;
const ROW_HEIGHT = 160;
const LEFT_MARGIN = 140;
const TOP_MARGIN = 76;

export function buildFamilyTreeSnapshot(params: {
  membership: MembershipRow;
  tree: FamilyTreeRow;
  people: PersonRow[];
  relationships: RelationshipRow[];
  suggestions: SuggestedEditRow[];
  activity: ActivityLogRow[];
}): FamilyTreeSnapshot | null {
  const { activity, membership, people, relationships, suggestions, tree } = params;

  if (people.length === 0) {
    return null;
  }

  const viewerPersonId = membership.person_id ?? people[0]?.id;

  if (!viewerPersonId) {
    return null;
  }

  const peopleMap = new Map(people.map((person) => [person.id, person]));
  const positions = buildLayoutPositions(people, relationships, viewerPersonId);
  const mappedPeople = people
    .slice()
    .sort((left, right) => {
      const leftPosition = positions.get(left.id);
      const rightPosition = positions.get(right.id);

      if (!leftPosition || !rightPosition) {
        return left.primary_name.localeCompare(right.primary_name);
      }

      if (leftPosition.y !== rightPosition.y) {
        return leftPosition.y - rightPosition.y;
      }

      return leftPosition.x - rightPosition.x;
    })
    .map((person) =>
      mapPerson({
        person,
        peopleMap,
        positions,
        relationships,
        viewerPersonId,
      }),
    );

  const selectedPersonId = viewerPersonId;

  return {
    id: tree.id,
    name: tree.name,
    description:
      tree.description ??
      "Private family workspace backed by Supabase for collaborative family history.",
    currentViewerPersonId: viewerPersonId,
    selectedPersonId,
    viewerRole: mapViewerRole(membership.role),
    people: mappedPeople,
    relationships: relationships.map(mapRelationship),
    suggestions: suggestions.map((suggestion) => ({
      id: suggestion.id,
      label: buildSuggestionLabel(suggestion),
      status: suggestion.status === "rejected" ? "pending" : suggestion.status,
    })),
    activity: activity.map(mapActivity),
    stats: {
      peopleCount: people.length,
      pendingSuggestionCount: suggestions.filter((entry) => entry.status === "pending")
        .length,
      editorCount: 1,
      liveSync: true,
    },
  };
}

function mapViewerRole(role: MembershipRow["role"]): ViewerRole {
  return role;
}

function mapPerson(params: {
  person: PersonRow;
  peopleMap: Map<string, PersonRow>;
  positions: Map<string, { x: number; y: number }>;
  relationships: RelationshipRow[];
  viewerPersonId: string;
}): Person {
  const { peopleMap, person, positions, relationships, viewerPersonId } = params;
  const title = deriveKinshipTitle({
    relationships,
    peopleMap,
    viewerPersonId,
    targetPersonId: person.id,
  });
  const position = positions.get(person.id) ?? {
    x: LEFT_MARGIN,
    y: TOP_MARGIN,
  };

  return {
    id: person.id,
    primaryName: person.primary_name,
    chineseTitle: title.chineseTitle,
    englishTitle: title.englishTitle,
    relationLabel: title.englishTitle,
    branch: buildBranchLabel(person, relationships, viewerPersonId),
    years: buildYearsLabel(person),
    photoUrl: person.photo_url,
    avatarLabel: buildAvatarLabel(person.primary_name),
    description: buildDescription(person, title.englishTitle),
    personalNote: buildPersonalNote(person, title.englishTitle),
    x: position.x,
    y: position.y,
    accent: mapPersonAccent(person, relationships, viewerPersonId),
  };
}

function mapPersonAccent(
  person: PersonRow,
  relationships: RelationshipRow[],
  viewerPersonId: string,
): PersonAccent {
  const directRelationship = getDirectRelationship(relationships, viewerPersonId, person.id);

  if (
    directRelationship?.relationship_type === "step_parent" ||
    directRelationship?.relationship_type === "guardian"
  ) {
    return "step";
  }

  if (directRelationship?.relationship_type === "spouse") {
    return "marriage";
  }

  return "blood";
}

function mapRelationship(relationship: RelationshipRow): Relationship {
  return {
    id: relationship.id,
    fromPersonId: relationship.from_person_id,
    toPersonId: relationship.to_person_id,
    type: relationship.relationship_type,
    status: relationship.status,
    style: mapRelationshipStyle(relationship),
  };
}

function mapRelationshipStyle(relationship: RelationshipRow): RelationshipStyle {
  if (relationship.relationship_type === "spouse") {
    return "marriage";
  }

  if (
    relationship.relationship_type === "step_parent" ||
    relationship.relationship_type === "guardian" ||
    relationship.status !== "active"
  ) {
    return "indirect";
  }

  return "blood";
}

function mapActivity(activity: ActivityLogRow): ActivityEntry {
  return {
    id: activity.id,
    summary: activity.summary,
    occurredAtLabel: formatRelativeTime(activity.created_at),
  };
}

function deriveKinshipTitle(params: {
  relationships: RelationshipRow[];
  peopleMap: Map<string, PersonRow>;
  viewerPersonId: string;
  targetPersonId: string;
}) {
  const { peopleMap, relationships, targetPersonId, viewerPersonId } = params;

  if (viewerPersonId === targetPersonId) {
    return {
      chineseTitle: "我",
      englishTitle: "Current viewer",
    };
  }

  const target = peopleMap.get(targetPersonId);

  if (!target) {
    return {
      chineseTitle: "亲属",
      englishTitle: "Family member",
    };
  }

  const directRelationship = getDirectRelationship(relationships, viewerPersonId, targetPersonId);

  if (directRelationship) {
    return mapDirectKinshipTitle(directRelationship, target);
  }

  const path = getPathBetweenPeople(relationships, viewerPersonId, targetPersonId);

  if (path.length === 3) {
    const [viewerId, middleId, finalId] = path;
    const middle = peopleMap.get(middleId);

    if (!middle) {
      return fallbackKinshipTitle(target);
    }

    if (isParentOf(relationships, middleId, viewerId) && isParentOf(relationships, middleId, finalId)) {
      return mapSiblingKinshipTitle(peopleMap.get(viewerId), target);
    }

    if (isParentOf(relationships, middleId, viewerId) && isParentOf(relationships, finalId, middleId)) {
      return mapGrandparentKinshipTitle(middle, target);
    }

    if (isParentOf(relationships, viewerId, middleId) && directSpouseOf(relationships, middleId, finalId)) {
      return {
        chineseTitle: "女婿",
        englishTitle: "Child's spouse",
      };
    }
  }

  return fallbackKinshipTitle(target);
}

function fallbackKinshipTitle(person: PersonRow) {
  return {
    chineseTitle: person.primary_name,
    englishTitle: buildEnglishTitle(person),
  };
}

function buildEnglishTitle(person: PersonRow) {
  if (person.generation_index === null) {
    return "Family member";
  }

  return `Generation ${person.generation_index} family member`;
}

function mapDirectKinshipTitle(relationship: RelationshipRow, target: PersonRow) {
  if (relationship.relationship_type === "spouse") {
    if (target.gender === "male") {
      return { chineseTitle: "丈夫", englishTitle: "Husband" };
    }

    if (target.gender === "female") {
      return { chineseTitle: "妻子", englishTitle: "Wife" };
    }

    return { chineseTitle: "配偶", englishTitle: "Spouse" };
  }

  if (relationship.from_person_id === target.id) {
    if (target.gender === "male") {
      return { chineseTitle: "爸爸", englishTitle: "Father" };
    }

    if (target.gender === "female") {
      return { chineseTitle: "妈妈", englishTitle: "Mother" };
    }

    return { chineseTitle: "父母", englishTitle: "Parent" };
  }

  if (target.gender === "male") {
    return { chineseTitle: "儿子", englishTitle: "Son" };
  }

  if (target.gender === "female") {
    return { chineseTitle: "女儿", englishTitle: "Daughter" };
  }

  return { chineseTitle: "孩子", englishTitle: "Child" };
}

function mapSiblingKinshipTitle(viewer: PersonRow | undefined, target: PersonRow) {
  const older = isOlderThan(target, viewer);

  if (target.gender === "male") {
    return older
      ? { chineseTitle: "哥哥", englishTitle: "Older brother" }
      : { chineseTitle: "弟弟", englishTitle: "Younger brother" };
  }

  if (target.gender === "female") {
    return older
      ? { chineseTitle: "姐姐", englishTitle: "Older sister" }
      : { chineseTitle: "妹妹", englishTitle: "Younger sister" };
  }

  return { chineseTitle: "兄弟姐妹", englishTitle: "Sibling" };
}

function mapGrandparentKinshipTitle(parent: PersonRow, target: PersonRow) {
  if (parent.gender === "male") {
    if (target.gender === "male") {
      return { chineseTitle: "爷爷", englishTitle: "Paternal grandfather" };
    }

    if (target.gender === "female") {
      return { chineseTitle: "奶奶", englishTitle: "Paternal grandmother" };
    }
  }

  if (parent.gender === "female") {
    if (target.gender === "male") {
      return { chineseTitle: "外公", englishTitle: "Maternal grandfather" };
    }

    if (target.gender === "female") {
      return { chineseTitle: "外婆", englishTitle: "Maternal grandmother" };
    }
  }

  return { chineseTitle: "祖父母", englishTitle: "Grandparent" };
}

function getDirectRelationship(
  relationships: RelationshipRow[],
  viewerPersonId: string,
  targetPersonId: string,
) {
  return relationships.find((relationship) => {
    return (
      (relationship.from_person_id === viewerPersonId &&
        relationship.to_person_id === targetPersonId) ||
      (relationship.from_person_id === targetPersonId &&
        relationship.to_person_id === viewerPersonId)
    );
  });
}

function directSpouseOf(
  relationships: RelationshipRow[],
  leftPersonId: string,
  rightPersonId: string,
) {
  return relationships.some((relationship) => {
    return (
      relationship.relationship_type === "spouse" &&
      ((relationship.from_person_id === leftPersonId &&
        relationship.to_person_id === rightPersonId) ||
        (relationship.from_person_id === rightPersonId &&
          relationship.to_person_id === leftPersonId))
    );
  });
}

function isParentOf(
  relationships: RelationshipRow[],
  parentPersonId: string,
  childPersonId: string,
) {
  return relationships.some((relationship) => {
    return (
      relationship.relationship_type === "biological_parent" &&
      relationship.from_person_id === parentPersonId &&
      relationship.to_person_id === childPersonId
    );
  });
}

function getPathBetweenPeople(
  relationships: RelationshipRow[],
  startPersonId: string,
  targetPersonId: string,
) {
  if (startPersonId === targetPersonId) {
    return [startPersonId];
  }

  const adjacency = new Map<string, string[]>();

  for (const relationship of relationships) {
    appendAdjacent(adjacency, relationship.from_person_id, relationship.to_person_id);
    appendAdjacent(adjacency, relationship.to_person_id, relationship.from_person_id);
  }

  const queue: string[] = [startPersonId];
  const visited = new Set<string>([startPersonId]);
  const parents = new Map<string, string | null>([[startPersonId, null]]);

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    if (current === targetPersonId) {
      break;
    }

    for (const next of adjacency.get(current) ?? []) {
      if (visited.has(next)) {
        continue;
      }

      visited.add(next);
      parents.set(next, current);
      queue.push(next);
    }
  }

  if (!parents.has(targetPersonId)) {
    return [];
  }

  const path: string[] = [];
  let cursor: string | null = targetPersonId;

  while (cursor) {
    path.push(cursor);
    cursor = parents.get(cursor) ?? null;
  }

  return path.reverse();
}

function appendAdjacent(adjacency: Map<string, string[]>, from: string, to: string) {
  const existing = adjacency.get(from);

  if (existing) {
    existing.push(to);
    return;
  }

  adjacency.set(from, [to]);
}

function isOlderThan(left: PersonRow, right: PersonRow | undefined) {
  if (!left.birth_date || !right?.birth_date) {
    return false;
  }

  return left.birth_date < right.birth_date;
}

function buildBranchLabel(
  person: PersonRow,
  relationships: RelationshipRow[],
  viewerPersonId: string,
) {
  if (person.id === viewerPersonId) {
    return "Viewer branch";
  }

  const directRelationship = getDirectRelationship(relationships, viewerPersonId, person.id);

  if (directRelationship?.relationship_type === "spouse") {
    return "Marriage branch";
  }

  if (isParentOf(relationships, person.id, viewerPersonId)) {
    return "Parent branch";
  }

  if (isParentOf(relationships, viewerPersonId, person.id)) {
    return "Descendant branch";
  }

  const path = getPathBetweenPeople(relationships, viewerPersonId, person.id);

  if (path.length === 3) {
    const [viewerId, middleId, finalId] = path;

    if (isParentOf(relationships, middleId, viewerId) && isParentOf(relationships, middleId, finalId)) {
      return "Sibling branch";
    }

    if (isParentOf(relationships, middleId, viewerId) && isParentOf(relationships, finalId, middleId)) {
      return "Grandparent branch";
    }
  }

  if (person.generation_index === null) {
    return "Unplaced branch";
  }

  return `Generation ${person.generation_index}`;
}

function buildYearsLabel(person: PersonRow) {
  const birth = person.birth_date ? person.birth_date.slice(0, 4) : "?";
  const death = person.death_date ? person.death_date.slice(0, 4) : person.is_living ? "" : "?";

  if (!death) {
    return `${birth} -`;
  }

  return `${birth} - ${death}`;
}

function buildDescription(person: PersonRow, englishTitle: string) {
  if (person.bio?.trim()) {
    return person.bio.trim();
  }

  const generation =
    person.generation_index === null ? "an unplaced generation" : `generation ${person.generation_index}`;

  return `${person.primary_name} is currently labeled as ${englishTitle.toLowerCase()} in ${generation}.`;
}

function buildPersonalNote(person: PersonRow, englishTitle: string) {
  if (person.current_place?.trim()) {
    return `Current place: ${person.current_place.trim()}.`;
  }

  return `Quick note: verify ${englishTitle.toLowerCase()} details before using this branch in mutation review flows.`;
}

function buildAvatarLabel(primaryName: string) {
  return primaryName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function buildSuggestionLabel(suggestion: SuggestedEditRow) {
  return `${suggestion.action_type} ${suggestion.target_entity_type}`;
}

function groupPeopleByGeneration(people: PersonRow[], relationships: RelationshipRow[], viewerPersonId: string) {
  return people.reduce<Record<string, PersonRow[]>>((groups, person) => {
    const key = getGenerationKey(person);
    groups[key] ??= [];
    groups[key].push(person);
    groups[key].sort((left, right) =>
      comparePeopleForLayout(left, right, relationships, viewerPersonId),
    );
    return groups;
  }, {});
}

function comparePeopleForLayout(
  left: PersonRow,
  right: PersonRow,
  relationships: RelationshipRow[],
  viewerPersonId: string,
) {
  const priorityDifference =
    getLayoutPriority(left, relationships, viewerPersonId) -
    getLayoutPriority(right, relationships, viewerPersonId);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  if (left.birth_date && right.birth_date && left.birth_date !== right.birth_date) {
    return left.birth_date.localeCompare(right.birth_date);
  }

  return left.primary_name.localeCompare(right.primary_name);
}

function getLayoutPriority(
  person: PersonRow,
  relationships: RelationshipRow[],
  viewerPersonId: string,
) {
  if (person.id === viewerPersonId) {
    return 0;
  }

  const directRelationship = getDirectRelationship(relationships, viewerPersonId, person.id);

  if (directRelationship?.relationship_type === "spouse") {
    return 1;
  }

  if (isParentOf(relationships, viewerPersonId, person.id)) {
    return 2;
  }

  const path = getPathBetweenPeople(relationships, viewerPersonId, person.id);

  if (path.length === 3) {
    const [viewerId, middleId, finalId] = path;

    if (isParentOf(relationships, middleId, viewerId) && isParentOf(relationships, middleId, finalId)) {
      return 3;
    }

    if (isParentOf(relationships, person.id, middleId) && isParentOf(relationships, middleId, viewerId)) {
      return 4;
    }
  }

  if (isParentOf(relationships, person.id, viewerPersonId)) {
    return 5;
  }

  return 10;
}

function buildLayoutPositions(
  people: PersonRow[],
  relationships: RelationshipRow[],
  viewerPersonId: string,
) {
  const grouped = groupPeopleByGeneration(people, relationships, viewerPersonId);
  const positions = new Map<string, { x: number; y: number }>();
  const generationKeys = Object.keys(grouped)
    .map(Number)
    .sort((left, right) => left - right);

  generationKeys.forEach((generation, rowIndex) => {
    const row = grouped[String(generation)] ?? [];

    row.forEach((person, columnIndex) => {
      positions.set(person.id, {
        x: LEFT_MARGIN + columnIndex * COLUMN_WIDTH,
        y: TOP_MARGIN + rowIndex * ROW_HEIGHT,
      });
    });
  });

  alignChildrenUnderParents(positions, people, relationships);
  return positions;
}

function alignChildrenUnderParents(
  positions: Map<string, { x: number; y: number }>,
  people: PersonRow[],
  relationships: RelationshipRow[],
) {
  for (const person of people) {
    const parents = getParentsOf(relationships, person.id)
      .map((parentId) => positions.get(parentId))
      .filter((entry): entry is { x: number; y: number } => Boolean(entry));
    const position = positions.get(person.id);

    if (!position || parents.length === 0) {
      continue;
    }

    const averageX =
      parents.reduce((sum, parent) => sum + parent.x, 0) / parents.length;
    position.x = averageX;
  }
}

function getParentsOf(relationships: RelationshipRow[], childPersonId: string) {
  return relationships
    .filter((relationship) => {
      return (
        relationship.relationship_type === "biological_parent" &&
        relationship.to_person_id === childPersonId
      );
    })
    .map((relationship) => relationship.from_person_id);
}

function getGenerationKey(person: PersonRow) {
  return String(Math.max(person.generation_index ?? 0, 0));
}

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

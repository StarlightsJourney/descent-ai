import type {
  FamilyTreeSnapshot,
  Person,
  Relationship,
  ViewerRole,
} from "@/lib/family-tree/types";

export function getSelectedPerson(tree: FamilyTreeSnapshot): Person | undefined {
  return tree.people.find((person) => person.id === tree.selectedPersonId);
}

export function getViewerPerson(tree: FamilyTreeSnapshot): Person | undefined {
  return tree.people.find((person) => person.id === tree.currentViewerPersonId);
}

export function getNodeMap(tree: FamilyTreeSnapshot) {
  return new Map(tree.people.map((person) => [person.id, person]));
}

export function getViewerEditRoute(role: ViewerRole) {
  return role === "guest" || role === "contributor"
    ? "Suggestion only"
    : "Direct edit";
}

export function canDirectEdit(role: ViewerRole) {
  return role === "editor" || role === "admin";
}

export function getPathToSelected(tree: FamilyTreeSnapshot): string[] {
  const start = tree.currentViewerPersonId;
  const goal = tree.selectedPersonId;

  if (start === goal) {
    return [tree.currentViewerPersonId];
  }

  const adjacency = buildAdjacency(tree.relationships);
  const queue: string[] = [start];
  const visited = new Set<string>([start]);
  const parents = new Map<string, string | null>([[start, null]]);

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    if (current === goal) {
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

  if (!parents.has(goal)) {
    return [];
  }

  const path: string[] = [];
  let cursor: string | null = goal;

  while (cursor) {
    path.push(cursor);
    cursor = parents.get(cursor) ?? null;
  }

  return path.reverse();
}

export function getDisplayPathLabels(tree: FamilyTreeSnapshot): string[] {
  const path = getPathToSelected(tree);
  const viewer = getViewerPerson(tree);
  const selected = getSelectedPerson(tree);
  const nodeMap = getNodeMap(tree);

  return path.map((personId, index) => {
    if (index === 0 && viewer) {
      return viewer.primaryName;
    }

    if (index === path.length - 1 && selected) {
      return selected.chineseTitle;
    }

    return nodeMap.get(personId)?.englishTitle ?? personId;
  });
}

function buildAdjacency(relationships: Relationship[]) {
  const adjacency = new Map<string, string[]>();

  for (const relationship of relationships) {
    appendEdge(adjacency, relationship.fromPersonId, relationship.toPersonId);
    appendEdge(adjacency, relationship.toPersonId, relationship.fromPersonId);
  }

  return adjacency;
}

function appendEdge(adjacency: Map<string, string[]>, from: string, to: string) {
  const existing = adjacency.get(from);

  if (existing) {
    existing.push(to);
    return;
  }

  adjacency.set(from, [to]);
}

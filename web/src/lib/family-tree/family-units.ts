import type {
  FamilyUnit,
  FamilyUnitChild,
  FamilyUnitKind,
  FamilyUnitParentLink,
  Relationship,
  RelationshipStatus,
  RelationshipType,
} from "@/lib/family-tree/types";

const PRIMARY_PARENT_TYPES: RelationshipType[] = [
  "biological_parent",
  "adoptive_parent",
  "guardian",
];

const PARENT_CHILD_TYPES: RelationshipType[] = [
  ...PRIMARY_PARENT_TYPES,
  "step_parent",
];

export function deriveFamilyUnits(relationships: Relationship[]): FamilyUnit[] {
  const childEdgeMap = buildChildEdgeMap(relationships);
  const partnerUnits = relationships
    .filter((relationship) => relationship.type === "spouse")
    .map((relationship) => buildPartnerUnit(relationship, childEdgeMap));
  const coveredChildren = new Set(
    partnerUnits.flatMap((unit) => unit.children.map((child) => child.childId)),
  );
  const fallbackUnits = buildFallbackUnits(childEdgeMap, coveredChildren);

  return [...partnerUnits, ...fallbackUnits].sort(compareFamilyUnits);
}

function buildPartnerUnit(
  relationship: Relationship,
  childEdgeMap: Map<string, Relationship[]>,
): FamilyUnit {
  const parentIds = [relationship.fromPersonId, relationship.toPersonId].sort();
  const children = Array.from(childEdgeMap.entries())
    .map(([childId, edges]) => buildPartnerUnitChild(childId, parentIds, edges))
    .filter((child): child is FamilyUnitChild => Boolean(child))
    .sort(compareFamilyUnitChildren);

  return {
    id: `partner:${relationship.id}`,
    kind: "partner",
    status: mapFamilyUnitStatus(relationship.status),
    partnerRelationshipId: relationship.id,
    parentIds,
    children,
  };
}

function buildPartnerUnitChild(
  childId: string,
  parentIds: string[],
  edges: Relationship[],
): FamilyUnitChild | null {
  const primaryEdges = edges.filter(isPrimaryParentEdge);
  const partnerPrimaryEdges = primaryEdges.filter((edge) => parentIds.includes(edge.fromPersonId));
  const partnerStepEdges = edges.filter((edge) => {
    return edge.type === "step_parent" && parentIds.includes(edge.fromPersonId);
  });
  const outsidePrimaryParentIds = primaryEdges
    .filter((edge) => !parentIds.includes(edge.fromPersonId))
    .map((edge) => edge.fromPersonId)
    .sort();
  const uniquePrimaryPartnerCount = new Set(
    partnerPrimaryEdges.map((edge) => edge.fromPersonId),
  ).size;
  const uniqueStepPartnerCount = new Set(
    partnerStepEdges.map((edge) => edge.fromPersonId),
  ).size;
  const hasBothPrimaryParents =
    uniquePrimaryPartnerCount === 2 && outsidePrimaryParentIds.length === 0;
  const hasStepSupportedPlacement =
    uniquePrimaryPartnerCount === 1 &&
    uniqueStepPartnerCount >= 1 &&
    outsidePrimaryParentIds.length === 0;

  if (!hasBothPrimaryParents && !hasStepSupportedPlacement) {
    return null;
  }

  const parentLinks = edges
    .filter((edge) => parentIds.includes(edge.fromPersonId))
    .map(mapFamilyUnitParentLink)
    .sort(compareParentLinks);

  return {
    childId,
    role: classifyFamilyUnitChild(parentLinks),
    parentLinks,
    outsidePrimaryParentIds,
  };
}

function buildFallbackUnits(
  childEdgeMap: Map<string, Relationship[]>,
  coveredChildren: Set<string>,
): FamilyUnit[] {
  const groups = new Map<
    string,
    {
      kind: FamilyUnitKind;
      parentIds: string[];
      children: FamilyUnitChild[];
    }
  >();

  for (const [childId, edges] of childEdgeMap.entries()) {
    if (coveredChildren.has(childId)) {
      continue;
    }

    const primaryEdges = edges.filter(isPrimaryParentEdge);

    if (primaryEdges.length === 0) {
      continue;
    }

    const parentIds = Array.from(
      new Set(primaryEdges.map((edge) => edge.fromPersonId)),
    ).sort();
    const kind: FamilyUnitKind =
      parentIds.length === 1 ? "single_parent" : "co_parenting";
    const key = `${kind}:${parentIds.join("|")}`;
    const parentLinks = primaryEdges
      .map(mapFamilyUnitParentLink)
      .sort(compareParentLinks);
    const child = {
      childId,
      role: classifyFamilyUnitChild(parentLinks),
      parentLinks,
      outsidePrimaryParentIds: [],
    } satisfies FamilyUnitChild;
    const existing = groups.get(key);

    if (existing) {
      existing.children.push(child);
      continue;
    }

    groups.set(key, {
      kind,
      parentIds,
      children: [child],
    });
  }

  return Array.from(groups.entries()).map(([key, group]) => ({
    id: key,
    kind: group.kind,
    status: "active",
    partnerRelationshipId: null,
    parentIds: group.parentIds,
    children: group.children.sort(compareFamilyUnitChildren),
  }));
}

function buildChildEdgeMap(relationships: Relationship[]) {
  const childEdgeMap = new Map<string, Relationship[]>();

  for (const relationship of relationships) {
    if (!PARENT_CHILD_TYPES.includes(relationship.type) || relationship.status === "inactive") {
      continue;
    }

    const existing = childEdgeMap.get(relationship.toPersonId) ?? [];
    existing.push(relationship);
    childEdgeMap.set(relationship.toPersonId, existing);
  }

  return childEdgeMap;
}

function mapFamilyUnitStatus(status: RelationshipStatus): FamilyUnit["status"] {
  if (status === "active") {
    return "active";
  }

  if (status === "divorced" || status === "separated") {
    return "former";
  }

  return "inactive";
}

function mapFamilyUnitParentLink(edge: Relationship): FamilyUnitParentLink {
  if (edge.type === "spouse") {
    throw new Error("Spouse edges cannot be mapped as family-unit parent links.");
  }

  return {
    relationshipId: edge.id,
    parentId: edge.fromPersonId,
    type: edge.type,
    status: edge.status,
    isPrimary: isPrimaryParentEdge(edge),
  };
}

function classifyFamilyUnitChild(parentLinks: FamilyUnitParentLink[]): FamilyUnitChild["role"] {
  if (parentLinks.some((link) => link.type === "step_parent")) {
    return "step";
  }

  const primaryTypes = Array.from(
    new Set(parentLinks.filter((link) => link.isPrimary).map((link) => link.type)),
  );

  if (primaryTypes.length !== 1) {
    return "mixed";
  }

  if (primaryTypes[0] === "biological_parent") {
    return "biological";
  }

  if (primaryTypes[0] === "adoptive_parent") {
    return "adopted";
  }

  if (primaryTypes[0] === "guardian") {
    return "guardian";
  }

  return "mixed";
}

function isPrimaryParentEdge(relationship: Relationship) {
  return PRIMARY_PARENT_TYPES.includes(relationship.type) && relationship.status !== "inactive";
}

function compareParentLinks(left: FamilyUnitParentLink, right: FamilyUnitParentLink) {
  if (left.parentId !== right.parentId) {
    return left.parentId.localeCompare(right.parentId);
  }

  return left.type.localeCompare(right.type);
}

function compareFamilyUnitChildren(left: FamilyUnitChild, right: FamilyUnitChild) {
  return left.childId.localeCompare(right.childId);
}

function compareFamilyUnits(left: FamilyUnit, right: FamilyUnit) {
  if (left.kind !== right.kind) {
    return left.kind.localeCompare(right.kind);
  }

  if (left.parentIds.length !== right.parentIds.length) {
    return left.parentIds.length - right.parentIds.length;
  }

  return left.id.localeCompare(right.id);
}

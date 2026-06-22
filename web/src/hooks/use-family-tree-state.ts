"use client";

import { useCallback, useMemo, useState } from "react";

import {
  getDisplayPathLabelsForSelection,
  getPersonById,
  getViewerPerson,
} from "@/lib/family-tree/selectors";
import type { FamilyTreeSnapshot } from "@/lib/family-tree/types";

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.1;
const DEFAULT_VIEWPORT_TARGET = {
  targetX: 420,
  targetY: 240,
};
const DEFAULT_VIEWPORT_SIZE = {
  width: 1200,
  height: 800,
};

const DEFAULT_VIEWPORT = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

const NODE_WIDTH = 152;
const NODE_HEIGHT = 164;
const INITIAL_FOCUSED_NODE_X = 980;
const INITIAL_FOCUSED_NODE_Y = 760;
type Viewport = typeof DEFAULT_VIEWPORT;
type ViewportTarget = typeof DEFAULT_VIEWPORT_TARGET;
type ViewportSize = typeof DEFAULT_VIEWPORT_SIZE;
type ViewportBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};
type ZoomOptions = {
  target?: ViewportTarget;
};
type PanOptions = {
  viewportSize?: ViewportSize;
  bounds?: ViewportBounds;
  padding?: number;
};
type FitViewportOptions = {
  target?: ViewportTarget;
  viewportSize?: ViewportSize;
  bounds?: ViewportBounds;
  padding?: number;
  minZoom?: number;
  maxZoom?: number;
};

export function useFamilyTreeState(initialTree: FamilyTreeSnapshot) {
  const initialSelectedPerson =
    getPersonById(initialTree, initialTree.selectedPersonId) ?? initialTree.people[0];
  const [selectedPersonId, setSelectedPersonId] = useState(
    initialTree.selectedPersonId
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [viewportTarget, setViewportTargetState] = useState<ViewportTarget>(
    DEFAULT_VIEWPORT_TARGET
  );
  const [viewport, setViewport] = useState<Viewport>(() =>
    initialSelectedPerson
      ? {
          ...DEFAULT_VIEWPORT,
          ...buildCenteredViewport(
            INITIAL_FOCUSED_NODE_X,
            INITIAL_FOCUSED_NODE_Y,
            DEFAULT_VIEWPORT.zoom,
            DEFAULT_VIEWPORT_TARGET
          ),
        }
      : DEFAULT_VIEWPORT
  );

  const selectedPerson = useMemo(
    () => getPersonById(initialTree, selectedPersonId),
    [initialTree, selectedPersonId]
  );

  const viewerPerson = useMemo(
    () => getViewerPerson(initialTree),
    [initialTree]
  );

  const filteredPeople = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    if (!normalized) {
      return initialTree.people;
    }

    return initialTree.people.filter((person) => {
      return (
        person.primaryName.toLowerCase().includes(normalized) ||
        person.chineseTitle.toLowerCase().includes(normalized) ||
        person.englishTitle.toLowerCase().includes(normalized) ||
        person.branch.toLowerCase().includes(normalized)
      );
    });
  }, [initialTree.people, searchQuery]);

  const pathLabels = useMemo(() => {
    return getDisplayPathLabelsForSelection(initialTree, selectedPersonId);
  }, [initialTree, selectedPersonId]);

  const selectPerson = useCallback(
    (personId: string) => {
      setSelectedPersonId(personId);
    },
    []
  );

  const selectFirstSearchResult = useCallback(() => {
    if (filteredPeople.length === 0) {
      return;
    }

    const nextPerson = filteredPeople[0];
    setSelectedPersonId(nextPerson.id);
  }, [filteredPeople]);

  const setViewportTarget = useCallback((target: ViewportTarget) => {
    setViewportTargetState(normalizeViewportTarget(target));
  }, []);

  const zoomTo = useCallback((zoom: number, options?: ZoomOptions) => {
    const nextTarget = normalizeViewportTarget(options?.target ?? viewportTarget);
    setViewportTargetState(nextTarget);
    setViewport((current) =>
      buildZoomedViewport(current, clampZoom(zoom), nextTarget)
    );
  }, [viewportTarget]);

  const zoomIn = useCallback((options?: ZoomOptions) => {
    const nextTarget = normalizeViewportTarget(options?.target ?? viewportTarget);
    setViewportTargetState(nextTarget);
    setViewport((current) =>
      buildZoomedViewport(current, clampZoom(current.zoom + ZOOM_STEP), nextTarget)
    );
  }, [viewportTarget]);

  const zoomOut = useCallback((options?: ZoomOptions) => {
    const nextTarget = normalizeViewportTarget(options?.target ?? viewportTarget);
    setViewportTargetState(nextTarget);
    setViewport((current) =>
      buildZoomedViewport(current, clampZoom(current.zoom - ZOOM_STEP), nextTarget)
    );
  }, [viewportTarget]);

  const fitTree = useCallback((options?: FitViewportOptions) => {
    const nextTarget = normalizeViewportTarget(options?.target ?? viewportTarget);
    const nextViewportSize = normalizeViewportSize(options?.viewportSize);
    const bounds =
      options?.bounds ?? buildPeopleBounds(initialTree.people) ?? buildViewportBoundsFromTarget(nextTarget);
    const nextViewport = buildFittedViewport(bounds, {
      target: nextTarget,
      viewportSize: nextViewportSize,
      padding: options?.padding,
      minZoom: options?.minZoom,
      maxZoom: options?.maxZoom,
    });

    setViewportTargetState(nextTarget);
    setViewport(nextViewport);
  }, [initialTree.people, viewportTarget]);

  const panBy = useCallback((deltaX: number, deltaY: number, options?: PanOptions) => {
    const bounds = options?.bounds;
    const viewportSize = normalizeViewportSize(options?.viewportSize);
  const padding = options?.padding ?? 260;

    setViewport((current) => {
      const nextViewport = {
        ...current,
        offsetX: current.offsetX + deltaX,
        offsetY: current.offsetY + deltaY,
      };

      if (!bounds) {
        return nextViewport;
      }

      return clampViewportToBounds(nextViewport, bounds, viewportSize, padding);
    });
  }, []);

  const centerOnSelected = useCallback(() => {
    if (!selectedPerson) {
      return;
    }

    setViewport((current) => ({
      ...current,
      ...buildCenteredViewport(
        selectedPerson.x,
        selectedPerson.y,
        current.zoom,
        viewportTarget
      ),
    }));
  }, [selectedPerson, viewportTarget]);

  const centerOnCoordinates = useCallback((
    x: number,
    y: number,
    target?: ViewportTarget
  ) => {
    const nextTarget = normalizeViewportTarget(target ?? viewportTarget);
    setViewportTargetState(nextTarget);
    setViewport((current) => ({
      ...current,
      ...buildCenteredViewport(x, y, current.zoom, nextTarget),
    }));
  }, [viewportTarget]);

  return {
    tree: initialTree,
    selectedPerson,
    selectedPersonId,
    viewerPerson,
    pathLabels,
    filteredPeople,
    searchQuery,
    setSearchQuery,
    selectPerson,
    selectFirstSearchResult,
    viewport,
    viewportTarget,
    setViewportTarget,
    zoomTo,
    zoomIn,
    zoomOut,
    fitTree,
    panBy,
    centerOnSelected,
    centerOnCoordinates,
  };
}

function roundZoom(value: number) {
  return Number(value.toFixed(2));
}

function buildCenteredViewport(
  x: number,
  y: number,
  zoom: number,
  target = DEFAULT_VIEWPORT_TARGET
) {
  const centerX = x + NODE_WIDTH / 2;
  const centerY = y + NODE_HEIGHT / 2;

  return {
    offsetX: target.targetX - centerX * zoom,
    offsetY: target.targetY - centerY * zoom,
  };
}

function clampZoom(value: number, minZoom = MIN_ZOOM, maxZoom = MAX_ZOOM) {
  return roundZoom(Math.min(maxZoom, Math.max(minZoom, value)));
}

function normalizeViewportTarget(target: ViewportTarget) {
  return {
    targetX: target.targetX,
    targetY: target.targetY,
  };
}

function normalizeViewportSize(viewportSize?: ViewportSize) {
  return {
    width: viewportSize?.width ?? DEFAULT_VIEWPORT_SIZE.width,
    height: viewportSize?.height ?? DEFAULT_VIEWPORT_SIZE.height,
  };
}

function buildZoomedViewport(
  viewport: Viewport,
  zoom: number,
  target: ViewportTarget
) {
  if (viewport.zoom === zoom) {
    return viewport;
  }

  const worldX = (target.targetX - viewport.offsetX) / viewport.zoom;
  const worldY = (target.targetY - viewport.offsetY) / viewport.zoom;

  return {
    zoom,
    offsetX: target.targetX - worldX * zoom,
    offsetY: target.targetY - worldY * zoom,
  };
}

function buildPeopleBounds(people: FamilyTreeSnapshot["people"]) {
  if (people.length === 0) {
    return null;
  }

  return people.reduce<ViewportBounds>(
    (bounds, person) => ({
      minX: Math.min(bounds.minX, person.x),
      minY: Math.min(bounds.minY, person.y),
      maxX: Math.max(bounds.maxX, person.x + NODE_WIDTH),
      maxY: Math.max(bounds.maxY, person.y + NODE_HEIGHT),
    }),
    {
      minX: people[0].x,
      minY: people[0].y,
      maxX: people[0].x + NODE_WIDTH,
      maxY: people[0].y + NODE_HEIGHT,
    }
  );
}

function buildViewportBoundsFromTarget(target: ViewportTarget): ViewportBounds {
  return {
    minX: target.targetX,
    minY: target.targetY,
    maxX: target.targetX,
    maxY: target.targetY,
  };
}

function buildFittedViewport(
  bounds: ViewportBounds,
  options: Required<Pick<FitViewportOptions, "target" | "viewportSize">> &
    Pick<FitViewportOptions, "padding" | "minZoom" | "maxZoom">
) {
  const padding = options.padding ?? 80;
  const minZoom = options.minZoom ?? MIN_ZOOM;
  const maxZoom = options.maxZoom ?? MAX_ZOOM;
  const contentWidth = Math.max(bounds.maxX - bounds.minX, 1);
  const contentHeight = Math.max(bounds.maxY - bounds.minY, 1);
  const availableWidth = Math.max(options.viewportSize.width - padding * 2, 1);
  const availableHeight = Math.max(options.viewportSize.height - padding * 2, 1);
  const zoom = clampZoom(
    Math.min(availableWidth / contentWidth, availableHeight / contentHeight),
    minZoom,
    maxZoom
  );
  const contentCenterX = (bounds.minX + bounds.maxX) / 2;
  const contentCenterY = (bounds.minY + bounds.maxY) / 2;

  return {
    zoom,
    offsetX: options.target.targetX - contentCenterX * zoom,
    offsetY: options.target.targetY - contentCenterY * zoom,
  };
}

function clampViewportToBounds(
  viewport: Viewport,
  bounds: ViewportBounds,
  viewportSize: ViewportSize,
  padding: number,
) {
  const scaledMinX = bounds.minX * viewport.zoom;
  const scaledMaxX = bounds.maxX * viewport.zoom;
  const scaledMinY = bounds.minY * viewport.zoom;
  const scaledMaxY = bounds.maxY * viewport.zoom;
  const scaledWidth = scaledMaxX - scaledMinX;
  const scaledHeight = scaledMaxY - scaledMinY;
  const visibleSliceX = Math.min(
    scaledWidth,
    Math.max(72, Math.min(156, scaledWidth * 0.22)),
  );
  const visibleSliceY = Math.min(
    scaledHeight,
    Math.max(96, Math.min(220, scaledHeight * 0.35)),
  );
  const minOffsetX =
    scaledWidth + padding * 2 < viewportSize.width
      ? visibleSliceX - scaledMaxX
      : viewportSize.width - scaledMaxX - padding;
  const maxOffsetX =
    scaledWidth + padding * 2 < viewportSize.width
      ? viewportSize.width - visibleSliceX - scaledMinX
      : padding - scaledMinX;
  const minOffsetY =
    scaledHeight + padding * 2 < viewportSize.height
      ? visibleSliceY - scaledMaxY
      : viewportSize.height - scaledMaxY - padding;
  const maxOffsetY =
    scaledHeight + padding * 2 < viewportSize.height
      ? viewportSize.height - visibleSliceY - scaledMinY
      : padding - scaledMinY;

  return {
    ...viewport,
    offsetX: clampAxis(viewport.offsetX, minOffsetX, maxOffsetX),
    offsetY: clampAxis(viewport.offsetY, minOffsetY, maxOffsetY),
  };
}

function clampAxis(value: number, min: number, max: number) {
  if (min > max) {
    return (min + max) / 2;
  }

  return Math.min(max, Math.max(min, value));
}

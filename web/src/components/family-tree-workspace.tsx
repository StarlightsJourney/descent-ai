"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutPanelTop,
  Search,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PersonDetailsForm } from "@/components/person-details-form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFamilyTreeState } from "@/hooks/use-family-tree-state";
import {
  canDirectEdit,
  getPersonById,
  getViewerEditRoute,
} from "@/lib/family-tree/selectors";
import type {
  FamilyTreeSnapshot,
  FamilyUnit,
  PersonAccent,
  RelationshipType,
  RelationshipStyle,
} from "@/lib/family-tree/types";
import { cn } from "@/lib/utils";

type FamilyTreeWorkspaceProps = {
  initialTree: FamilyTreeSnapshot;
  source: "demo-unconfigured" | "demo-guest" | "demo-unseeded" | "live";
  userEmail: string | null;
};

type DragState = {
  pointerX: number;
  pointerY: number;
  pointerId: number;
  moved: boolean;
};

const NODE_WIDTH = 152;
const NODE_HEIGHT = 164;
const TREE_CANVAS_WIDTH = 2200;
const TREE_CANVAS_HEIGHT = 1680;
const FOCUSED_CENTER_X = 980;
const FOCUSED_CENTER_Y = 760;
const FOCUSED_ROW_GAP = 320;
const FOCUSED_COLUMN_GAP = 280;
const FOCUSED_LANE_GAP = 320;
const OVERVIEW_NODE_CENTER_X = 76;
const OVERVIEW_NODE_CENTER_Y = 36;
const OVERVIEW_NODE_RADIUS = 28;
const OVERVIEW_PARENT_ATTACH_Y = 68;

export function FamilyTreeWorkspace({
  initialTree,
  source,
  userEmail,
}: FamilyTreeWorkspaceProps) {
  const {
    tree,
    selectedPerson,
    pathLabels,
    searchQuery,
    setSearchQuery,
    filteredPeople,
    selectPerson,
    viewport,
    fitTree,
    zoomIn,
    zoomOut,
    panBy,
    centerOnCoordinates,
    setViewportTarget,
  } = useFamilyTreeState(initialTree);
  const directEdit = canDirectEdit(tree.viewerRole);
  const branchOptions = useMemo(
    () => buildBranchOptions(tree, selectedPerson?.id),
    [tree, selectedPerson?.id],
  );
  const [focusMode, setFocusMode] = useState(true);
  const [preferredFamilyUnitId, setPreferredFamilyUnitId] = useState<string | null>(null);
  const activeFamilyUnitId = useMemo(() => {
    if (preferredFamilyUnitId && branchOptions.some((option) => option.id === preferredFamilyUnitId)) {
      return preferredFamilyUnitId;
    }

    return branchOptions[0]?.id ?? null;
  }, [branchOptions, preferredFamilyUnitId]);
  const visiblePersonIds = useMemo(
    () =>
      buildVisiblePersonIds({
        tree,
        selectedPersonId: selectedPerson?.id ?? null,
        activeFamilyUnitId,
        focusMode,
      }),
    [activeFamilyUnitId, focusMode, selectedPerson?.id, tree],
  );
  const visiblePeople = useMemo(
    () => tree.people.filter((person) => visiblePersonIds.has(person.id)),
    [tree.people, visiblePersonIds],
  );
  const renderPeople = useMemo(
    () =>
      buildRenderPeople({
        tree,
        visiblePeople,
        selectedPersonId: selectedPerson?.id ?? null,
        activeFamilyUnitId,
        focusMode,
      }),
    [activeFamilyUnitId, focusMode, selectedPerson?.id, tree, visiblePeople],
  );
  const renderNodeMap = useMemo(
    () => new Map(renderPeople.map((person) => [person.id, person])),
    [renderPeople],
  );
  const activePanBounds = useMemo(
    () => buildPeopleBounds(focusMode ? renderPeople : tree.people),
    [focusMode, renderPeople, tree.people],
  );
  const spouseEdges = useMemo(
    () => buildSpouseEdges(tree, renderNodeMap, visiblePersonIds, focusMode),
    [focusMode, tree, renderNodeMap, visiblePersonIds],
  );
  const parentChildGroups = useMemo(
    () => buildParentChildGroups(tree, visiblePersonIds, focusMode),
    [focusMode, tree, visiblePersonIds],
  );
  const viewportContainerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const cameraTransitionTimeoutRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraTransitioning, setCameraTransitioning] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [viewportMetrics, setViewportMetrics] = useState({ width: 1200, height: 800 });
  useEffect(() => {
    const updateViewportMetrics = () => {
      setViewportMetrics({
        width: viewportContainerRef.current?.clientWidth ?? 1200,
        height: viewportContainerRef.current?.clientHeight ?? 800,
      });
    };

    updateViewportMetrics();
    window.addEventListener("resize", updateViewportMetrics);

    return () => {
      window.removeEventListener("resize", updateViewportMetrics);
    };
  }, []);
  const getViewportTarget = useCallback(() => {
    const width = viewportMetrics.width;
    const height = viewportMetrics.height;

    return {
      targetX: Math.max(220, width / 2),
      targetY: Math.max(180, height / 2),
    };
  }, [viewportMetrics.height, viewportMetrics.width]);
  const beginDrag = useCallback(
    (pointerId: number, clientX: number, clientY: number, target: HTMLElement) => {
      target.setPointerCapture(pointerId);
      dragStateRef.current = {
        pointerX: clientX,
        pointerY: clientY,
        pointerId,
        moved: false,
      };
    },
    [],
  );
  const updateDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragStateRef.current) {
        return false;
      }

      const deltaX = clientX - dragStateRef.current.pointerX;
      const deltaY = clientY - dragStateRef.current.pointerY;
      const moved =
        dragStateRef.current.moved ||
        Math.abs(deltaX) > 4 ||
        Math.abs(deltaY) > 4;

      dragStateRef.current = {
        pointerX: clientX,
        pointerY: clientY,
        pointerId: dragStateRef.current.pointerId,
        moved,
      };

      if (!moved) {
        return false;
      }

      setIsDragging(true);
      panBy(deltaX, deltaY, {
        bounds: activePanBounds,
        viewportSize: viewportMetrics,
        padding: focusMode ? 220 : 260,
      });
      return true;
    },
    [activePanBounds, focusMode, panBy, viewportMetrics],
  );
  const endDrag = useCallback((pointerId: number, target: HTMLElement) => {
    if (target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }

    const moved = dragStateRef.current?.moved ?? false;
    suppressClickRef.current = moved;
    dragStateRef.current = null;
    setIsDragging(false);
    return moved;
  }, []);
  const cancelDrag = useCallback((pointerId: number, target: HTMLElement) => {
    if (target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }

    dragStateRef.current = null;
    setIsDragging(false);
  }, []);
  useEffect(() => {
    const target = getViewportTarget();
    setViewportTarget(target);
  }, [getViewportTarget, setViewportTarget]);
  const handleSelectPerson = (personId: string) => {
    if (selectedPerson?.id === personId && detailsOpen) {
      setDetailsOpen(false);
      return;
    }

    setPreferredFamilyUnitId(null);
    setDetailsOpen(true);
    selectPerson(personId);
    if (cameraTransitionTimeoutRef.current) {
      window.clearTimeout(cameraTransitionTimeoutRef.current);
    }
    setCameraTransitioning(true);
    cameraTransitionTimeoutRef.current = window.setTimeout(() => {
      setCameraTransitioning(false);
      cameraTransitionTimeoutRef.current = null;
    }, 760);

    if (focusMode) {
      centerOnCoordinates(FOCUSED_CENTER_X, FOCUSED_CENTER_Y, getViewportTarget());
      return;
    }

    const person = getPersonById(tree, personId);

    if (person) {
      centerOnCoordinates(person.x, person.y, getViewportTarget());
    }
  };
  const handleSelectFirstSearchResult = () => {
    const nextPerson = filteredPeople[0];

    if (!nextPerson) {
      return;
    }

    handleSelectPerson(nextPerson.id);
  };
  useEffect(() => {
    return () => {
      if (cameraTransitionTimeoutRef.current) {
        window.clearTimeout(cameraTransitionTimeoutRef.current);
      }
    };
  }, []);
  return (
    <main className="h-screen w-screen overflow-hidden bg-[linear-gradient(180deg,#eef2f6_0%,#dde6ee_100%)] text-slate-950">
      <div className="relative h-full w-full">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4 py-4 sm:px-5 lg:px-6">
          <div className="pointer-events-auto flex items-center gap-3 px-1 py-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.16)]">
              D
            </div>
            <h1 className="text-xl font-semibold text-slate-950 drop-shadow-[0_8px_18px_rgba(255,255,255,0.6)]">
              Descent
            </h1>
          </div>

          <div className="pointer-events-auto flex items-center gap-2" data-ui="true">
            <AuthStatus source={source} userEmail={userEmail} />
            <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/88 px-2 py-2 shadow-sm backdrop-blur">
              <Button
                variant={focusMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const nextFocusMode = !focusMode;
                  setFocusMode(nextFocusMode);

                  if (nextFocusMode) {
                    centerOnCoordinates(FOCUSED_CENTER_X, FOCUSED_CENTER_Y, getViewportTarget());
                  } else {
                    fitTree({
                      target: getViewportTarget(),
                      viewportSize: viewportMetrics,
                      bounds: buildPeopleBounds(tree.people),
                      padding: 120,
                      maxZoom: 0.95,
                    });
                  }
                }}
              >
                {focusMode ? "Focused" : "Full tree"}
              </Button>
              <span className="px-2 text-xs font-medium text-slate-500">
                {Math.round(viewport.zoom * 100)}%
              </span>
            </div>
            <Button
              variant={leftPanelOpen ? "default" : "outline"}
              size="icon-sm"
              onClick={() => setLeftPanelOpen((current) => !current)}
            >
              <LayoutPanelTop className="size-4" />
            </Button>
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="secondary"
                    size="sm"
                    className="xl:hidden"
                  />
                }
              >
                <Users className="size-4" />
                Details
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh]">
                <SheetHeader>
                  <SheetTitle>{selectedPerson?.primaryName}</SheetTitle>
                  <SheetDescription>
                    {selectedPerson?.chineseTitle} / {selectedPerson?.englishTitle}
                  </SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-4">
                  <MobileDetails
                    primaryName={selectedPerson?.primaryName ?? ""}
                    avatarLabel={selectedPerson?.avatarLabel ?? ""}
                    photoUrl={selectedPerson?.photoUrl ?? null}
                    branch={selectedPerson?.branch ?? ""}
                    years={selectedPerson?.years ?? ""}
                    description={selectedPerson?.description ?? ""}
                    personalNote={selectedPerson?.personalNote ?? ""}
                    viewerRole={tree.viewerRole}
                    editRoute={getViewerEditRoute(tree.viewerRole)}
                    pathLabels={pathLabels}
                    chineseTitle={selectedPerson?.chineseTitle ?? ""}
                    englishTitle={selectedPerson?.englishTitle ?? ""}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="absolute inset-0">
          <div className="relative h-full overflow-hidden bg-white/20">
            {leftPanelOpen ? (
              <div className="absolute left-4 top-20 z-20 hidden h-[min(72vh,760px)] w-[320px] overflow-hidden rounded-[28px] border border-white/70 bg-white/94 shadow-[0_24px_80px_rgba(15,23,42,0.14)] xl:block">
                <Tabs defaultValue="reviews" className="flex h-full flex-col">
                  <div className="border-b border-slate-200/80 px-4 py-3">
                    <TabsList variant="line">
                      <TabsTrigger value="reviews">Reviews</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                      <TabsTrigger value="legend">Legend</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="reviews" className="m-0 flex-1">
                    <ScrollArea className="h-full px-4 py-4">
                      <div className="space-y-3">
                        {tree.suggestions.map((suggestion) => (
                          <Card
                            key={suggestion.id}
                            size="sm"
                            className="border-white/70 bg-white"
                          >
                            <CardContent className="space-y-3 px-4 py-4">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm text-slate-700">{suggestion.label}</p>
                                <Badge variant="secondary" className="rounded-md">
                                  {suggestion.status}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm">Approve</Button>
                                <Button variant="outline" size="sm">
                                  Review
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="activity" className="m-0 flex-1">
                    <ScrollArea className="h-full px-4 py-4">
                      <div className="space-y-3">
                        {tree.activity.map((entry) => (
                          <Card
                            key={entry.id}
                            size="sm"
                            className="border-white/70 bg-white"
                          >
                            <CardContent className="space-y-1 px-4 py-4">
                              <p className="text-sm text-slate-700">{entry.summary}</p>
                              <p className="text-xs text-slate-500">{entry.occurredAtLabel}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="legend" className="m-0 flex-1">
                    <ScrollArea className="h-full px-4 py-4">
                      <div className="space-y-4">
                        <LegendRow label="Blood lineage" tone="bg-emerald-500" />
                        <LegendRow label="Marriage" tone="bg-amber-500" />
                        <LegendRow
                          label="Indirect or inactive relationship"
                          tone="border-t-2 border-dashed border-slate-500"
                          dashed
                        />
                        <Separator />
                        <p className="text-sm leading-6 text-slate-600">
                          Focused branch is the readable working mode. Full tree is best treated as an overview map.
                        </p>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            ) : null}

            <div
              ref={viewportContainerRef}
              className={`relative h-full overflow-hidden touch-none select-none bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.22)_1px,transparent_0)] [background-size:28px_28px] ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              onClick={(event) => {
                if (suppressClickRef.current) {
                  suppressClickRef.current = false;
                  return;
                }

                const target = event.target as HTMLElement;

                if (!target.closest("[data-node='true']") && !target.closest("[data-ui='true']")) {
                  setDetailsOpen(false);
                }
              }}
              onWheel={(event) => {
                event.preventDefault();

                if (event.deltaY < 0) {
                  zoomIn({ target: getViewportTarget() });
                  return;
                }

                zoomOut({ target: getViewportTarget() });
              }}
              onPointerDown={(event) => {
                if (event.button !== 0) {
                  return;
                }

                if ((event.target as HTMLElement).closest("[data-ui='true'], [data-node='true']")) {
                  return;
                }

                beginDrag(
                  event.pointerId,
                  event.clientX,
                  event.clientY,
                  event.currentTarget,
                );
              }}
              onPointerMove={(event) => {
                updateDrag(event.clientX, event.clientY);
              }}
              onPointerUp={(event) => {
                endDrag(event.pointerId, event.currentTarget);
              }}
              onPointerCancel={(event) => {
                cancelDrag(event.pointerId, event.currentTarget);
              }}
              onPointerLeave={() => {
                if (!dragStateRef.current?.moved) {
                  dragStateRef.current = null;
                  setIsDragging(false);
                }
              }}
            >
              <div
                className="relative overflow-hidden"
                style={{
                  height: `${TREE_CANVAS_HEIGHT}px`,
                  minWidth: `${TREE_CANVAS_WIDTH}px`,
                }}
              >
                <div
                  className={`absolute inset-0 origin-top-left ${
                    cameraTransitioning && !isDragging
                      ? "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      : ""
                  }`}
                  style={{
                    transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.zoom})`,
                  }}
                >
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox={`0 0 ${TREE_CANVAS_WIDTH} ${TREE_CANVAS_HEIGHT}`}
                    fill="none"
                    aria-hidden="true"
                  >
                    {spouseEdges.map((edge) => (
                      <line
                        key={edge.id}
                        x1={edge.x1}
                        y1={edge.y}
                        x2={edge.x2}
                        y2={edge.y}
                        className={edgeClass(edge.style)}
                        stroke="currentColor"
                        strokeLinecap="round"
                      />
                    ))}
                    {parentChildGroups.map((group) => {
                      const children = group.childIds
                        .map((childId) => renderNodeMap.get(childId))
                        .filter((child): child is NonNullable<typeof child> => Boolean(child));
                      const parents = group.parentIds
                        .map((parentId) => renderNodeMap.get(parentId))
                        .filter((parent): parent is NonNullable<typeof parent> => Boolean(parent));

                      if (children.length === 0 || parents.length === 0) {
                        return null;
                      }

                      const parentCenters = parents.map((parent) =>
                        getParentAttachPoint(parent, group.focusMode),
                      );
                      const railY = Math.max(...parentCenters.map((parent) => parent.y)) + 28;
                      const junctionX =
                        parentCenters.reduce((sum, parent) => sum + parent.x, 0) /
                        parentCenters.length;
                      const strokeClass = edgeClass(group.style);
                      const dashPattern = group.style === "indirect" ? "8 8" : undefined;
                      const childAttachPoints = children.map((child) =>
                        getChildAttachPoint(child, group.focusMode),
                      );
                      const siblingRailY = Math.min(...childAttachPoints.map((child) => child.y)) - 28;

                      return (
                        <g key={group.id}>
                          {parentCenters.map((parent, index) => (
                            <path
                              key={`${group.id}-parent-${index}`}
                              d={`M ${parent.x} ${parent.y} V ${railY} H ${junctionX}`}
                              className={strokeClass}
                              stroke="currentColor"
                              strokeDasharray={dashPattern}
                              strokeLinecap="round"
                            />
                          ))}
                          {children.length === 1 ? (
                            <path
                              d={
                                Math.abs(junctionX - childAttachPoints[0].x) > 2
                                  ? `M ${junctionX} ${railY} H ${childAttachPoints[0].x} V ${childAttachPoints[0].y}`
                                  : `M ${junctionX} ${railY} V ${childAttachPoints[0].y}`
                              }
                              className={strokeClass}
                              stroke="currentColor"
                              strokeDasharray={dashPattern}
                              strokeLinecap="round"
                            />
                          ) : (
                            <>
                              <path
                                d={`M ${junctionX} ${railY} V ${siblingRailY}`}
                                className={strokeClass}
                                stroke="currentColor"
                                strokeDasharray={dashPattern}
                                strokeLinecap="round"
                              />
                              <path
                                d={`M ${Math.min(
                                  ...childAttachPoints.map((child) => child.x),
                                )} ${siblingRailY} H ${Math.max(
                                  ...childAttachPoints.map((child) => child.x),
                                )}`}
                                className={strokeClass}
                                stroke="currentColor"
                                strokeDasharray={dashPattern}
                                strokeLinecap="round"
                              />
                              {childAttachPoints.map((child, index) => (
                                <path
                                  key={`${group.id}-child-${index}`}
                                  d={`M ${child.x} ${siblingRailY} V ${child.y}`}
                                  className={strokeClass}
                                  stroke="currentColor"
                                  strokeDasharray={dashPattern}
                                  strokeLinecap="round"
                                />
                              ))}
                            </>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {renderPeople.map((person) => {
                    const active = person.id === selectedPerson?.id;
                    const showNodeMeta = focusMode;

                    return (
                      <button
                        key={person.id}
                        data-node="true"
                        type="button"
                        onPointerDown={(event) => {
                          if (event.button !== 0) {
                            return;
                          }

                          beginDrag(
                            event.pointerId,
                            event.clientX,
                            event.clientY,
                            event.currentTarget,
                          );
                        }}
                        onPointerMove={(event) => {
                          updateDrag(event.clientX, event.clientY);
                        }}
                        onPointerUp={(event) => {
                          endDrag(event.pointerId, event.currentTarget);
                        }}
                        onPointerCancel={(event) => {
                          cancelDrag(event.pointerId, event.currentTarget);
                        }}
                        onClick={(event) => {
                          event.stopPropagation();

                          if (suppressClickRef.current) {
                            suppressClickRef.current = false;
                            return;
                          }

                          handleSelectPerson(person.id);
                        }}
                        className={nodeClass(person.accent, active, showNodeMeta)}
                        style={{ left: person.x, top: person.y }}
                      >
                        <div className="flex h-full flex-col items-center text-center">
                          <div className={avatarFrameClass(person.accent, active)}>
                            <AvatarBadge
                              avatarLabel={person.avatarLabel}
                              photoUrl={person.photoUrl}
                              dominant={showNodeMeta}
                            />
                          </div>
                          {showNodeMeta ? (
                            <div className="mt-3 flex min-w-0 flex-1 flex-col items-center">
                              <span className="block max-w-[180px] text-sm font-semibold leading-5 text-slate-950">
                                {person.primaryName}
                              </span>
                              <span className="mt-1 block max-w-[190px] text-xs leading-5 text-slate-600">
                                {person.chineseTitle} / {person.englishTitle}
                              </span>
                              <span className="mt-1 block text-[11px] font-medium tracking-[0.04em] text-slate-500">
                                {person.years}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-5 left-5 z-20 hidden xl:block">
              <MiniMap
                people={tree.people}
                selectedPersonId={selectedPerson?.id ?? null}
                focusMode={focusMode}
              />
            </div>

            <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 w-[min(760px,calc(100%-2rem))] xl:w-[min(720px,calc(100%-24rem))] -translate-x-1/2 px-2">
              <div className="pointer-events-auto rounded-[24px] border border-white/70 bg-white/94 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur" data-ui="true">
                <div className="grid gap-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      aria-label="Search people"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleSelectFirstSearchResult();
                        }
                      }}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-9 shadow-none"
                      placeholder="Find a relative or describe a change"
                    />
                    {searchQuery.trim().length > 0 ? (
                      <div className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] rounded-2xl border border-slate-200 bg-white/96 p-2 shadow-[0_20px_50px_rgba(15,23,42,0.14)] backdrop-blur">
                        {filteredPeople.slice(0, 5).map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-slate-100"
                            onClick={() => {
                              handleSelectPerson(person.id);
                              setSearchQuery(person.primaryName);
                            }}
                          >
                            <span className="text-sm font-medium text-slate-900">
                              {person.primaryName}
                            </span>
                            <span className="text-xs text-slate-500">
                              {person.chineseTitle}
                            </span>
                          </button>
                        ))}
                        {searchQuery.trim().length > 2 ? (
                          <button
                            type="button"
                            className="mt-1 flex w-full items-center justify-between rounded-xl border border-dashed border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <span className="text-sm font-medium text-slate-900">
                              Suggest change
                            </span>
                            <span className="truncate pl-3 text-xs text-slate-500">
                              {searchQuery.trim()}
                            </span>
                          </button>
                        ) : null}
                        {filteredPeople.slice(0, 5).length === 0 && searchQuery.trim().length <= 2 ? (
                          <div className="px-3 py-2 text-sm text-slate-500">
                            No matching relative
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {detailsOpen && selectedPerson ? (
            <div className="absolute right-5 top-24 z-20 hidden h-[calc(100%-8.5rem)] w-[360px] xl:block" data-ui="true">
              <Card className="flex h-full flex-col border-white/70 bg-white/94 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <AvatarBadge
                        avatarLabel={selectedPerson?.avatarLabel ?? ""}
                        photoUrl={selectedPerson?.photoUrl ?? null}
                        large
                      />
                      <div>
                        <CardDescription>Selected person</CardDescription>
                        <CardTitle className="mt-1 text-2xl">
                          {selectedPerson.primaryName}
                        </CardTitle>
                        <p className="mt-2 text-sm text-slate-600">
                          {selectedPerson.chineseTitle} / {selectedPerson.englishTitle}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{selectedPerson.years}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-6 overflow-auto">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Branch", selectedPerson.branch],
                      ["Years", selectedPerson.years],
                      ["Viewer role", tree.viewerRole],
                      ["Edit route", getViewerEditRoute(tree.viewerRole)],
                    ].map(([label, value]) => (
                      <Card
                        key={label}
                        size="sm"
                        className="border-slate-200/80 bg-slate-50/80 shadow-none"
                      >
                        <CardContent className="px-4 py-4">
                          <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-950">Details</h3>
                      <Badge variant="secondary" className="rounded-md">
                        {directEdit ? "Direct edit" : "Suggestion flow"}
                      </Badge>
                    </div>
                    <Card className="border-slate-200/80 bg-slate-50/80 shadow-none">
                      <CardContent className="px-4 py-4">
                        <PersonDetailsForm
                          key={selectedPerson.id}
                          familyTreeId={tree.id}
                          personId={selectedPerson.id}
                          primaryName={selectedPerson.primaryName}
                          bio={selectedPerson.description}
                          currentPlace={selectedPerson.personalNote}
                          viewerRole={tree.viewerRole}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-950">Path to you</h3>
                      <Badge variant="secondary" className="rounded-md">
                        English titles
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {pathLabels.map((step, index) => (
                        <div key={`${step}-${index}`} className="flex items-center gap-2">
                          <span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
                            {step}
                          </span>
                          {index < pathLabels.length - 1 ? (
                            <span className="text-slate-400">-&gt;</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-950">Chinese title</h3>
                      <Button variant="outline" size="sm">
                        Override
                      </Button>
                    </div>
                    <Card className="border-slate-200/80 bg-slate-50/80 shadow-none">
                      <CardContent className="px-4 py-4">
                        <p className="text-xl font-semibold text-slate-950">
                          {selectedPerson.chineseTitle}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {selectedPerson.englishTitle}. This stays visible beside the path so users can connect the Chinese term to the family structure.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function edgeClass(style: RelationshipStyle) {
  if (style === "marriage") {
    return "stroke-[3] text-amber-500";
  }

  if (style === "indirect") {
    return "stroke-[3] text-slate-500";
  }

  return "stroke-[4] text-emerald-500";
}

function getNodeAnchor(
  person: FamilyTreeSnapshot["people"][number],
  focusMode: boolean,
) {
  if (focusMode) {
    return {
      centerX: person.x + NODE_WIDTH / 2,
      centerY: person.y + NODE_HEIGHT / 2,
      radius: NODE_WIDTH / 2,
    };
  }

  return {
    centerX: person.x + OVERVIEW_NODE_CENTER_X,
    centerY: person.y + OVERVIEW_NODE_CENTER_Y,
    radius: OVERVIEW_NODE_RADIUS,
  };
}

function getParentAttachPoint(
  person: FamilyTreeSnapshot["people"][number],
  focusMode: boolean,
) {
  if (focusMode) {
    return {
      x: person.x + NODE_WIDTH / 2,
      y: person.y + NODE_HEIGHT,
    };
  }

  return {
    x: person.x + OVERVIEW_NODE_CENTER_X,
    y: person.y + OVERVIEW_PARENT_ATTACH_Y,
  };
}

function getChildAttachPoint(
  person: FamilyTreeSnapshot["people"][number],
  focusMode: boolean,
) {
  if (focusMode) {
    return {
      x: person.x + NODE_WIDTH / 2,
      y: person.y,
    };
  }

  return {
    x: person.x + OVERVIEW_NODE_CENTER_X,
    y: person.y + 4,
  };
}

function buildPeopleBounds(people: FamilyTreeSnapshot["people"]) {
  if (people.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: TREE_CANVAS_WIDTH,
      maxY: TREE_CANVAS_HEIGHT,
    };
  }

  return people.reduce(
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
    },
  );
}

function nodeClass(accent: PersonAccent, active: boolean, showMeta: boolean) {
  const base = showMeta
    ? "absolute z-10 flex h-[164px] w-[152px] flex-col items-center justify-start bg-transparent px-2 py-2 text-center transition-[left,top,transform,opacity] duration-300 ease-out hover:z-20 hover:-translate-y-0.5 focus-visible:z-30"
    : "absolute z-10 flex h-[164px] w-[152px] flex-col items-center justify-center bg-transparent px-2 py-2 text-center transition-[left,top,transform,opacity] duration-300 ease-out hover:z-20 hover:-translate-y-0.5 focus-visible:z-30";

  if (active) {
    return `${base} z-30`;
  }

  return base;
}

function MiniMap({
  people,
  selectedPersonId,
  focusMode,
}: {
  people: FamilyTreeSnapshot["people"];
  selectedPersonId: string | null;
  focusMode: boolean;
}) {
  const width = 188;
  const height = 124;
  const scaleX = width / TREE_CANVAS_WIDTH;
  const scaleY = height / TREE_CANVAS_HEIGHT;

  return (
    <Card className="w-[220px] border-white/70 bg-white/92 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-sm">Map</CardTitle>
        <CardDescription>
          {focusMode ? "Focused branch view" : "Full tree overview"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50/90 p-3">
          <div
            className="relative overflow-hidden rounded-xl bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.18)_1px,transparent_0)] [background-size:14px_14px]"
            style={{ width, height }}
          >
            {people.map((person) => {
              const active = person.id === selectedPersonId;

              return (
                <span
                  key={person.id}
                  className={`absolute rounded-full ${
                    active ? "bg-slate-950 ring-2 ring-white" : "bg-slate-400"
                  }`}
                  style={{
                    left: `${person.x * scaleX}px`,
                    top: `${person.y * scaleY}px`,
                    width: active ? 8 : 5,
                    height: active ? 8 : 5,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function avatarFrameClass(accent: PersonAccent, active: boolean) {
  const base =
    "rounded-[28px] bg-transparent transition duration-150";

  if (accent === "marriage") {
    return `${base} ${active ? "ring-4 ring-amber-300 shadow-[0_18px_40px_rgba(245,158,11,0.26)]" : "ring-2 ring-amber-200/80"}`;
  }

  if (accent === "step") {
    return `${base} ${active ? "ring-4 ring-sky-300 shadow-[0_18px_40px_rgba(14,165,233,0.22)]" : "ring-2 ring-sky-200/80"}`;
  }

  return `${base} ${active ? "ring-4 ring-emerald-300 shadow-[0_18px_40px_rgba(16,185,129,0.24)]" : "ring-2 ring-emerald-200/80"}`;
}

function AvatarBadge({
  avatarLabel,
  photoUrl,
  large = false,
  dominant = false,
}: {
  avatarLabel: string;
  photoUrl: string | null;
  large?: boolean;
  dominant?: boolean;
}) {
  const sizeClass = dominant
    ? "size-28 rounded-[24px] text-2xl"
    : large
      ? "size-16 rounded-2xl text-lg"
      : "size-14 rounded-2xl text-sm";
  const frameClass = dominant
    ? "shadow-[0_14px_30px_rgba(15,23,42,0.12)] ring-4 ring-white"
    : "ring-1 ring-slate-200";

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={`${sizeClass} shrink-0 object-cover ${frameClass}`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} inline-flex shrink-0 items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] font-semibold text-slate-700 ${frameClass}`}
      aria-hidden="true"
    >
      {avatarLabel}
    </span>
  );
}

function buildSpouseEdges(
  tree: FamilyTreeSnapshot,
  nodeMap: Map<string, FamilyTreeSnapshot["people"][number]>,
  visiblePersonIds: Set<string>,
  focusMode: boolean,
) {
  return tree.familyUnits
    .filter((unit) => {
      return (
        unit.kind === "partner" &&
        unit.parentIds.length === 2 &&
        unit.parentIds.every((personId) => visiblePersonIds.has(personId))
      );
    })
    .map((unit) => {
      const from = nodeMap.get(unit.parentIds[0]);
      const to = nodeMap.get(unit.parentIds[1]);

      if (!from || !to) {
        return null;
      }

      const left = from.x <= to.x ? from : to;
      const right = from.x <= to.x ? to : from;
      const leftAnchor = getNodeAnchor(left, focusMode);
      const rightAnchor = getNodeAnchor(right, focusMode);

      return {
        id: unit.id,
        x1: leftAnchor.centerX + leftAnchor.radius,
        x2: rightAnchor.centerX - rightAnchor.radius,
        y: leftAnchor.centerY,
        style: mapPartnerUnitStyle(unit),
      };
    })
    .filter(
      (
        edge,
      ): edge is {
        id: string;
        x1: number;
        x2: number;
        y: number;
        style: RelationshipStyle;
      } =>
        Boolean(edge),
    );
}

function buildParentChildGroups(
  tree: FamilyTreeSnapshot,
  visiblePersonIds: Set<string>,
  focusMode: boolean,
) {
  return tree.familyUnits
    .filter((unit) => {
      const visibleChildren = unit.children.filter((child) =>
        visiblePersonIds.has(child.childId),
      );

      return (
        visibleChildren.length > 0 &&
        unit.parentIds.every((personId) => visiblePersonIds.has(personId)) &&
        visibleChildren.length > 0
      );
    })
    .map((unit) => ({
      id: unit.id,
      childIds: unit.children
        .filter((child) => visiblePersonIds.has(child.childId))
        .map((child) => child.childId)
        .sort(),
      parentIds: unit.parentIds,
      style: mapParentChildGroupStyle(unit),
      focusMode,
    }));
}

function buildRenderPeople(params: {
  tree: FamilyTreeSnapshot;
  visiblePeople: FamilyTreeSnapshot["people"];
  selectedPersonId: string | null;
  activeFamilyUnitId: string | null;
  focusMode: boolean;
}) {
  const { activeFamilyUnitId, focusMode, selectedPersonId, tree, visiblePeople } = params;

  if (!focusMode || !selectedPersonId) {
    return visiblePeople;
  }

  const positions = buildFocusedPositions({
    tree,
    visiblePeople,
    selectedPersonId,
    activeFamilyUnitId,
  });

  return visiblePeople.map((person) => {
    const position = positions.get(person.id);

    if (!position) {
      return person;
    }

    return {
      ...person,
      x: position.x,
      y: position.y,
    };
  });
}

function buildFocusedPositions(params: {
  tree: FamilyTreeSnapshot;
  visiblePeople: FamilyTreeSnapshot["people"];
  selectedPersonId: string;
  activeFamilyUnitId: string | null;
}) {
  const { activeFamilyUnitId, selectedPersonId, tree, visiblePeople } = params;
  const selectedPerson = getPersonById(tree, selectedPersonId);

  if (!selectedPerson) {
    return new Map<string, { x: number; y: number }>();
  }

  const peopleById = new Map(visiblePeople.map((person) => [person.id, person]));
  const laneAssignments = buildFocusedLaneAssignments({
    tree,
    selectedPersonId,
    activeFamilyUnitId,
    visiblePeople,
  });
  const levels = deriveRelativeGenerationLevels(
    tree.relationships,
    selectedPersonId,
    new Set(visiblePeople.map((person) => person.id)),
  );
  const rows = new Map<number, typeof visiblePeople>();

  for (const person of visiblePeople) {
    const level = levels.get(person.id) ?? 0;
    const row = rows.get(level) ?? [];
    row.push(person);
    rows.set(level, row);
  }

  const positions = new Map<string, { x: number; y: number }>();

  for (const [level, rowPeople] of rows.entries()) {
    const y = FOCUSED_CENTER_Y + level * FOCUSED_ROW_GAP;
    const ordered = rowPeople
      .slice()
      .sort((left, right) =>
        comparePeopleInFocusedRow({
          left,
          right,
          selectedPerson,
          selectedPersonId,
          tree,
          activeFamilyUnitId,
          laneAssignments,
          peopleById,
        }),
      );

    if (level === 0) {
      placeSelectedRow({
        ordered,
        positions,
        selectedPerson,
        selectedPersonId,
        y,
        laneAssignments,
      });
      continue;
    }

    const startX =
      FOCUSED_CENTER_X - ((ordered.length - 1) * FOCUSED_COLUMN_GAP) / 2;

    ordered.forEach((person, index) => {
      positions.set(person.id, {
        x: startX + index * FOCUSED_COLUMN_GAP,
        y,
      });
    });
  }

  return positions;
}

function placeSelectedRow(params: {
  ordered: FamilyTreeSnapshot["people"];
  positions: Map<string, { x: number; y: number }>;
  selectedPerson: FamilyTreeSnapshot["people"][number];
  selectedPersonId: string;
  y: number;
  laneAssignments: FocusedLaneAssignments;
}) {
  const { laneAssignments, ordered, positions, selectedPerson, selectedPersonId, y } = params;
  const centerX = FOCUSED_CENTER_X;
  positions.set(selectedPersonId, { x: centerX, y });

  const others = ordered.filter((person) => person.id !== selectedPersonId);
  const centerLanePeople = others.filter((person) => {
    return laneAssignments.personLaneIndexes.get(person.id) === 0;
  });
  const leftPeople = others
    .filter((person) => {
      const lane = laneAssignments.personLaneIndexes.get(person.id);
      return lane !== undefined ? lane < 0 : person.x < selectedPerson.x;
    })
    .sort((left, right) => {
      const leftLane = laneAssignments.personLaneIndexes.get(left.id) ?? -1;
      const rightLane = laneAssignments.personLaneIndexes.get(right.id) ?? -1;

      if (leftLane !== rightLane) {
        return leftLane - rightLane;
      }

      return left.x - right.x;
    });
  const rightPeople = others
    .filter((person) => {
      const lane = laneAssignments.personLaneIndexes.get(person.id);
      return lane !== undefined ? lane > 0 : person.x >= selectedPerson.x;
    })
    .sort((left, right) => {
      const leftLane = laneAssignments.personLaneIndexes.get(left.id) ?? 1;
      const rightLane = laneAssignments.personLaneIndexes.get(right.id) ?? 1;

      if (leftLane !== rightLane) {
        return leftLane - rightLane;
      }

      return left.x - right.x;
    });

  leftPeople
    .slice()
    .reverse()
    .forEach((person, index) => {
      const lane = laneAssignments.personLaneIndexes.get(person.id);
      positions.set(person.id, {
        x:
          lane !== undefined && lane < 0
            ? centerX + lane * FOCUSED_LANE_GAP
            : centerX - (index + 1) * FOCUSED_COLUMN_GAP,
        y,
      });
    });

  rightPeople.forEach((person, index) => {
    const lane = laneAssignments.personLaneIndexes.get(person.id);
    positions.set(person.id, {
      x:
        lane !== undefined && lane > 0
          ? centerX + lane * FOCUSED_LANE_GAP
          : centerX + (index + 1) * FOCUSED_COLUMN_GAP,
      y,
    });
  });

  centerLanePeople
    .sort((left, right) => left.x - right.x)
    .forEach((person, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const step = Math.floor(index / 2) + 1;

      positions.set(person.id, {
        x: centerX + direction * step * FOCUSED_COLUMN_GAP,
        y,
      });
    });
}

function deriveRelativeGenerationLevels(
  relationships: FamilyTreeSnapshot["relationships"],
  selectedPersonId: string,
  visiblePersonIds: Set<string>,
) {
  const adjacency = new Map<string, Array<{ personId: string; delta: number }>>();

  for (const relationship of relationships) {
    if (
      !visiblePersonIds.has(relationship.fromPersonId) ||
      !visiblePersonIds.has(relationship.toPersonId)
    ) {
      continue;
    }

    if (relationship.type === "spouse") {
      appendRelativeEdge(adjacency, relationship.fromPersonId, relationship.toPersonId, 0);
      appendRelativeEdge(adjacency, relationship.toPersonId, relationship.fromPersonId, 0);
      continue;
    }

    if (isParentChildRelationship(relationship.type)) {
      appendRelativeEdge(adjacency, relationship.fromPersonId, relationship.toPersonId, 1);
      appendRelativeEdge(adjacency, relationship.toPersonId, relationship.fromPersonId, -1);
    }
  }

  const levels = new Map<string, number>([[selectedPersonId, 0]]);
  const queue = [selectedPersonId];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    const currentLevel = levels.get(current) ?? 0;

    for (const edge of adjacency.get(current) ?? []) {
      if (levels.has(edge.personId)) {
        continue;
      }

      levels.set(edge.personId, currentLevel + edge.delta);
      queue.push(edge.personId);
    }
  }

  return levels;
}

function appendRelativeEdge(
  adjacency: Map<string, Array<{ personId: string; delta: number }>>,
  from: string,
  to: string,
  delta: number,
) {
  const existing = adjacency.get(from) ?? [];
  existing.push({ personId: to, delta });
  adjacency.set(from, existing);
}

function comparePeopleInFocusedRow(params: {
  left: FamilyTreeSnapshot["people"][number];
  right: FamilyTreeSnapshot["people"][number];
  selectedPerson: FamilyTreeSnapshot["people"][number];
  selectedPersonId: string;
  tree: FamilyTreeSnapshot;
  activeFamilyUnitId: string | null;
  laneAssignments: FocusedLaneAssignments;
  peopleById: Map<string, FamilyTreeSnapshot["people"][number]>;
}) {
  const {
    activeFamilyUnitId,
    laneAssignments,
    left,
    right,
    selectedPerson,
    selectedPersonId,
    tree,
  } = params;
  const leftPriority = getFocusPriority(tree, left.id, selectedPersonId, activeFamilyUnitId);
  const rightPriority = getFocusPriority(tree, right.id, selectedPersonId, activeFamilyUnitId);

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const leftLane = laneAssignments.personLaneIndexes.get(left.id);
  const rightLane = laneAssignments.personLaneIndexes.get(right.id);

  if (leftLane !== rightLane) {
    return compareLaneIndex(leftLane, rightLane);
  }

  const leftDistance = Math.abs(left.x - selectedPerson.x);
  const rightDistance = Math.abs(right.x - selectedPerson.x);

  if (leftDistance !== rightDistance) {
    return leftDistance - rightDistance;
  }

  return left.x - right.x;
}

type FocusedLaneAssignments = {
  personLaneIndexes: Map<string, number>;
  unitLaneIndexes: Map<string, number>;
};

function buildFocusedLaneAssignments(params: {
  tree: FamilyTreeSnapshot;
  selectedPersonId: string;
  activeFamilyUnitId: string | null;
  visiblePeople: FamilyTreeSnapshot["people"];
}): FocusedLaneAssignments {
  const { activeFamilyUnitId, selectedPersonId, tree, visiblePeople } = params;
  const visibleIds = new Set(visiblePeople.map((person) => person.id));
  const units = tree.familyUnits
    .filter((unit) => {
      if (
        !unit.parentIds.includes(selectedPersonId) &&
        !unit.children.some((child) => child.childId === selectedPersonId)
      ) {
        return false;
      }

      return (
        unit.parentIds.some((personId) => visibleIds.has(personId)) ||
        unit.children.some((child) => visibleIds.has(child.childId))
      );
    })
    .sort((left, right) => {
      if (left.id === activeFamilyUnitId) {
        return -1;
      }

      if (right.id === activeFamilyUnitId) {
        return 1;
      }

      return compareBranchPriority(left, right, selectedPersonId);
    });
  const unitLaneIndexes = new Map<string, number>();
  const personLaneIndexes = new Map<string, number>();
  const personLaneScores = new Map<string, number>();
  const laneSequence = buildLaneSequence(units.length);

  units.forEach((unit, index) => {
    const laneIndex = laneSequence[index] ?? 0;
    unitLaneIndexes.set(unit.id, laneIndex);

    const memberIds = new Set<string>([
      ...unit.parentIds,
      ...unit.children.map((child) => child.childId),
    ]);

    memberIds.forEach((personId) => {
      if (personId === selectedPersonId || !visibleIds.has(personId)) {
        return;
      }

      const score = Math.abs(laneIndex) * 10 + index;
      const existingScore = personLaneScores.get(personId);

      if (existingScore !== undefined && existingScore <= score) {
        return;
      }

      personLaneScores.set(personId, score);
      personLaneIndexes.set(personId, laneIndex);
    });
  });

  return {
    personLaneIndexes,
    unitLaneIndexes,
  };
}

function buildLaneSequence(count: number) {
  const lanes: number[] = [];

  for (let index = 0; index < count; index += 1) {
    if (index === 0) {
      lanes.push(0);
      continue;
    }

    const step = Math.ceil(index / 2);
    lanes.push(index % 2 === 1 ? -step : step);
  }

  return lanes;
}

function compareLaneIndex(left: number | undefined, right: number | undefined) {
  if (left === right) {
    return 0;
  }

  if (left === undefined) {
    return 1;
  }

  if (right === undefined) {
    return -1;
  }

  const leftOrder = Math.abs(left) * 10 + (left >= 0 ? 1 : 0);
  const rightOrder = Math.abs(right) * 10 + (right >= 0 ? 1 : 0);

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return left - right;
}

function getFocusPriority(
  tree: FamilyTreeSnapshot,
  personId: string,
  selectedPersonId: string,
  activeFamilyUnitId: string | null,
) {
  if (personId === selectedPersonId) {
    return 0;
  }

  if (!activeFamilyUnitId) {
    return 10;
  }

  const activeUnit = tree.familyUnits.find((unit) => unit.id === activeFamilyUnitId);

  if (!activeUnit) {
    return 10;
  }

  if (activeUnit.parentIds.includes(personId)) {
    return 1;
  }

  if (activeUnit.children.some((child) => child.childId === personId)) {
    return 2;
  }

  return 10;
}

function mapPartnerUnitStyle(unit: FamilyUnit): RelationshipStyle {
  return unit.status === "active" ? "marriage" : "indirect";
}

function mapParentChildGroupStyle(unit: FamilyUnit): RelationshipStyle {
  if (unit.status !== "active") {
    return "indirect";
  }

  if (
    unit.children.some((child) => {
      return (
        child.role === "step" ||
        child.role === "guardian" ||
        child.role === "mixed" ||
        child.outsidePrimaryParentIds.length > 0
      );
    })
  ) {
    return "indirect";
  }

  return "blood";
}

function buildBranchOptions(tree: FamilyTreeSnapshot, selectedPersonId: string | undefined) {
  if (!selectedPersonId) {
    return [];
  }

  return tree.familyUnits
    .filter((unit) => {
      return (
        unit.parentIds.includes(selectedPersonId) ||
        unit.children.some((child) => child.childId === selectedPersonId)
      );
    })
    .sort((left, right) => compareBranchPriority(left, right, selectedPersonId))
    .map((unit) => ({
      id: unit.id,
      label: buildBranchLabel(tree, unit, selectedPersonId),
    }));
}

function compareBranchPriority(left: FamilyUnit, right: FamilyUnit, selectedPersonId: string) {
  const leftPriority = getBranchPriority(left, selectedPersonId);
  const rightPriority = getBranchPriority(right, selectedPersonId);

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return left.id.localeCompare(right.id);
}

function getBranchPriority(unit: FamilyUnit, selectedPersonId: string) {
  const selectedIsChild = unit.children.some((child) => child.childId === selectedPersonId);

  if (selectedIsChild) {
    return 0;
  }

  if (unit.status === "active") {
    return 1;
  }

  if (unit.status === "former") {
    return 2;
  }

  return 3;
}

function buildBranchLabel(
  tree: FamilyTreeSnapshot,
  unit: FamilyUnit,
  selectedPersonId: string,
) {
  const selectedIsChild = unit.children.some((child) => child.childId === selectedPersonId);
  const partnerNames = unit.parentIds
    .filter((personId) => personId !== selectedPersonId)
    .map((personId) => getPersonById(tree, personId)?.primaryName ?? "Unknown")
    .join(" + ");

  if (selectedIsChild) {
    if (unit.parentIds.length > 1) {
      return "Parents";
    }

    return "Parent";
  }

  if (unit.kind === "partner") {
    if (unit.status === "former") {
      return partnerNames ? `Former: ${partnerNames}` : "Former branch";
    }

    return partnerNames || "Partner";
  }

  if (unit.kind === "single_parent") {
    return "Household";
  }

  return partnerNames ? `Co-parenting: ${partnerNames}` : "Co-parenting";
}

function buildVisiblePersonIds(params: {
  tree: FamilyTreeSnapshot;
  selectedPersonId: string | null;
  activeFamilyUnitId: string | null;
  focusMode: boolean;
}) {
  const { activeFamilyUnitId, focusMode, selectedPersonId, tree } = params;

  if (!focusMode) {
    return new Set(tree.people.map((person) => person.id));
  }

  const visible = new Set<string>();

  if (!selectedPersonId) {
    return visible;
  }

  visible.add(selectedPersonId);

  const units = tree.familyUnits.filter((unit) => {
    return (
      unit.parentIds.includes(selectedPersonId) ||
      unit.children.some((child) => child.childId === selectedPersonId)
    );
  });
  const orderedUnits = units.slice().sort((left, right) => {
    if (left.id === activeFamilyUnitId) {
      return -1;
    }

    if (right.id === activeFamilyUnitId) {
      return 1;
    }

    return compareBranchPriority(left, right, selectedPersonId);
  });

  for (const unit of orderedUnits) {
    unit.parentIds.forEach((personId) => visible.add(personId));

    for (const child of unit.children) {
      visible.add(child.childId);
      child.parentLinks.forEach((link) => visible.add(link.parentId));
      child.outsidePrimaryParentIds.forEach((personId) => visible.add(personId));
    }
  }

  let frontier = new Set(visible);

  for (let depth = 0; depth < 2; depth += 1) {
    const nextFrontier = new Set<string>();

    for (const relationship of tree.relationships) {
      if (frontier.has(relationship.fromPersonId) && !visible.has(relationship.toPersonId)) {
        visible.add(relationship.toPersonId);
        nextFrontier.add(relationship.toPersonId);
      }

      if (frontier.has(relationship.toPersonId) && !visible.has(relationship.fromPersonId)) {
        visible.add(relationship.fromPersonId);
        nextFrontier.add(relationship.fromPersonId);
      }
    }

    if (nextFrontier.size === 0) {
      break;
    }

    frontier = nextFrontier;
  }

  return visible;
}

function isParentChildRelationship(type: RelationshipType) {
  return (
    type === "biological_parent" ||
    type === "adoptive_parent" ||
    type === "step_parent" ||
    type === "guardian"
  );
}

function AuthStatus({
  source,
  userEmail,
}: {
  source: "demo-unconfigured" | "demo-guest" | "demo-unseeded" | "live";
  userEmail: string | null;
}) {
  if (source === "live") {
    return (
      <div data-ui="true" className="flex items-center gap-2">
        <Badge variant="secondary" className="rounded-full border border-white/70 bg-white/88 px-3 py-2 backdrop-blur">
          {userEmail ?? "Signed in"}
        </Badge>
        <a
          href="/sign-out"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Sign out
        </a>
      </div>
    );
  }

  if (source === "demo-unseeded") {
    return (
      <div className="flex items-center gap-2" data-ui="true">
        <Badge variant="secondary" className="rounded-full border border-white/70 bg-white/88 px-3 py-2 backdrop-blur">
          {userEmail ?? "Signed in"} / demo fallback
        </Badge>
        <a
          href="/sign-in"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Account
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" data-ui="true">
      <Badge variant="secondary" className="rounded-full border border-white/70 bg-white/88 px-3 py-2 backdrop-blur">
        Demo mode
      </Badge>
      <a
        href="/sign-in"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Sign in
      </a>
    </div>
  );
}

function LegendRow({
  label,
  tone,
  dashed = false,
}: {
  label: string;
  tone: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <span
        className={dashed ? `h-0 w-10 ${tone}` : `h-0.5 w-10 rounded-full ${tone}`}
      />
      <span>{label}</span>
    </div>
  );
}

function MobileDetails({
  primaryName,
  avatarLabel,
  photoUrl,
  branch,
  years,
  description,
  personalNote,
  viewerRole,
  editRoute,
  pathLabels,
  chineseTitle,
  englishTitle,
}: {
  primaryName: string;
  avatarLabel: string;
  photoUrl: string | null;
  branch: string;
  years: string;
  description: string;
  personalNote: string;
  viewerRole: string;
  editRoute: string;
  pathLabels: string[];
  chineseTitle: string;
  englishTitle: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <AvatarBadge avatarLabel={avatarLabel} photoUrl={photoUrl} large />
        <div>
          <p className="mt-1 text-lg font-semibold text-slate-950">{primaryName}</p>
          <p className="mt-1 text-sm text-slate-600">
            {chineseTitle} / {englishTitle}
          </p>
          <p className="mt-1 text-sm text-slate-500">{years}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          ["Branch", branch],
          ["Years", years],
          ["Viewer role", viewerRole],
          ["Edit route", editRoute],
        ].map(([label, value]) => (
          <Card
            key={label}
            size="sm"
            className="border-slate-200/80 bg-slate-50/80 shadow-none"
          >
            <CardContent className="px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
                {label}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Description</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <Card className="border-slate-200/80 bg-slate-50/80 shadow-none">
          <CardContent className="px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
              Personal note
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{personalNote}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-950">Path to you</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {pathLabels.map((step, index) => (
            <div key={`${step}-${index}`} className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
                {step}
              </span>
              {index < pathLabels.length - 1 ? (
                <span className="text-slate-400">-&gt;</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <Card className="border-slate-200/80 bg-slate-50/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Chinese title</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-lg font-semibold text-slate-950">{chineseTitle}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{englishTitle}</p>
        </CardContent>
      </Card>
    </div>
  );
}

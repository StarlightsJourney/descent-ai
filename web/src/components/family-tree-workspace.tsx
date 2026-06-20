"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bot,
  Clock3,
  GitBranch,
  Grip,
  LayoutPanelTop,
  Search,
  ShieldCheck,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PersonDetailsForm } from "@/components/person-details-form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFamilyTreeState } from "@/hooks/use-family-tree-state";
import {
  canDirectEdit,
  getNodeMap,
  getViewerEditRoute,
} from "@/lib/family-tree/selectors";
import type {
  FamilyTreeSnapshot,
  PersonAccent,
  RelationshipType,
  RelationshipStyle,
} from "@/lib/family-tree/types";

type FamilyTreeWorkspaceProps = {
  initialTree: FamilyTreeSnapshot;
};

type DragState = {
  pointerX: number;
  pointerY: number;
};

const NODE_WIDTH = 208;
const NODE_HEIGHT = 248;
const TREE_CANVAS_WIDTH = 1560;
const TREE_CANVAS_HEIGHT = 1320;

export function FamilyTreeWorkspace({
  initialTree,
}: FamilyTreeWorkspaceProps) {
  const {
    tree,
    selectedPerson,
    pathLabels,
    searchQuery,
    setSearchQuery,
    filteredPeople,
    selectPerson,
    selectFirstSearchResult,
    viewport,
    zoomIn,
    zoomOut,
    fitTree,
    panBy,
    centerOnSelected,
  } = useFamilyTreeState(initialTree);
  const directEdit = canDirectEdit(tree.viewerRole);
  const nodeMap = useMemo(() => getNodeMap(tree), [tree]);
  const spouseEdges = useMemo(() => buildSpouseEdges(tree, nodeMap), [tree, nodeMap]);
  const parentChildGroups = useMemo(() => buildParentChildGroups(tree), [tree]);
  const dragStateRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const stats = [
    {
      label: "Current tree",
      value: `${tree.stats.peopleCount} people`,
      icon: Users,
    },
    {
      label: "Suggestions",
      value: `${tree.stats.pendingSuggestionCount} pending`,
      icon: GitBranch,
    },
    {
      label: "Write access",
      value: `${tree.stats.editorCount} editors`,
      icon: ShieldCheck,
    },
    {
      label: "Realtime",
      value: tree.stats.liveSync ? "Live sync" : "Sync offline",
      icon: Clock3,
    },
  ];

  const zoomControls = [
    {
      label: "Zoom out",
      content: <ZoomOut className="size-4" />,
      onPress: zoomOut,
    },
    {
      label: "Center selection",
      content: (
        <span className="text-xs font-semibold">
          {Math.round(viewport.zoom * 100)}%
        </span>
      ),
      onPress: centerOnSelected,
    },
    {
      label: "Zoom in",
      content: <ZoomIn className="size-4" />,
      onPress: zoomIn,
    },
    {
      label: "Fit tree",
      content: <span>Fit</span>,
      onPress: fitTree,
    },
  ];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef2f6_0%,#e5ebf2_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 sm:px-5 lg:px-6">
        <header className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white shadow-sm">
                  D
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Private family workspace
                  </p>
                  <h1 className="text-2xl font-semibold text-slate-950">
                    {tree.name}
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1 rounded-md">
                  <Users className="size-3.5" />
                  One private tree
                </Badge>
                <Badge variant="secondary" className="gap-1 rounded-md">
                  <ShieldCheck className="size-3.5" />
                  Guest read access
                </Badge>
                <Badge variant="secondary" className="gap-1 rounded-md">
                  <Bot className="size-3.5" />
                  AI suggests, user confirms
                </Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                {tree.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map(({ icon: Icon, label, value }) => (
                <Card
                  key={label}
                  className="min-w-[150px] border-white/70 bg-white/80 shadow-[0_18px_48px_rgba(15,23,42,0.06)]"
                >
                  <CardContent className="flex items-start gap-3 px-4 py-4">
                    <div className="rounded-md bg-slate-100 p-2 text-slate-700">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">
                        {value}
                      </p>
                      <p className="text-xs text-slate-500">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </header>

        <section className="mt-4 grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden border-white/70 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <CardHeader className="gap-4 border-b border-slate-200/80">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex flex-1 flex-col gap-3 lg:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      aria-label="Search people"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          selectFirstSearchResult();
                        }
                      }}
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 pl-9 shadow-none"
                      placeholder="Find a relative"
                    />
                  </div>
                  <div className="min-w-0 flex-[1.35]">
                    <Command className="rounded-lg border border-slate-200 bg-slate-50 p-0 shadow-none">
                      <CommandInput placeholder="Describe a change or query" />
                      <CommandList className="max-h-36">
                        <CommandEmpty>No matching action.</CommandEmpty>
                        <CommandGroup heading="Search results">
                          {filteredPeople.slice(0, 4).map((person) => (
                            <CommandItem
                              key={person.id}
                              onSelect={() => selectPerson(person.id)}
                            >
                              {person.primaryName}
                              <CommandShortcut>
                                {person.chineseTitle}
                              </CommandShortcut>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandGroup heading="Suggested actions">
                          <CommandItem>
                            Show grandfather&apos;s younger brother and my path
                            <CommandShortcut>AI</CommandShortcut>
                          </CommandItem>
                          <CommandItem>
                            Add Sarah Lim as daughter of David Lim and Mei Tan
                            <CommandShortcut>Draft</CommandShortcut>
                          </CommandItem>
                          <CommandItem>
                            Explain why Ryan Lee is an indirect relation
                            <CommandShortcut>Path</CommandShortcut>
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start">
                  {zoomControls.map(({ label, content, onPress }, index) => (
                    <Tooltip key={label}>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="outline"
                            size={index === 3 ? "sm" : "icon-sm"}
                            onClick={onPress}
                          />
                        }
                      >
                        {content}
                      </TooltipTrigger>
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  ))}
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => panBy(40, 0)}
                        />
                      }
                    >
                      <Grip className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent>Pan right</TooltipContent>
                  </Tooltip>
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
                      <LayoutPanelTop className="size-4" />
                      Details
                    </SheetTrigger>
                    <SheetContent side="bottom" className="max-h-[85vh]">
                      <SheetHeader>
                        <SheetTitle>{selectedPerson?.primaryName}</SheetTitle>
                        <SheetDescription>
                          {selectedPerson?.chineseTitle} /{" "}
                          {selectedPerson?.englishTitle}
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
            </CardHeader>

            <CardContent className="grid flex-1 gap-0 p-0 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div
                className={`relative overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.22)_1px,transparent_0)] [background-size:28px_28px] ${
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                }`}
                onPointerDown={(event) => {
                  dragStateRef.current = {
                    pointerX: event.clientX,
                    pointerY: event.clientY,
                  };
                  setIsDragging(true);
                }}
                onPointerMove={(event) => {
                  if (!dragStateRef.current) {
                    return;
                  }

                  const deltaX = event.clientX - dragStateRef.current.pointerX;
                  const deltaY = event.clientY - dragStateRef.current.pointerY;
                  dragStateRef.current = {
                    pointerX: event.clientX,
                    pointerY: event.clientY,
                  };
                  panBy(deltaX, deltaY);
                }}
                onPointerUp={() => {
                  dragStateRef.current = null;
                  setIsDragging(false);
                }}
                onPointerLeave={() => {
                  dragStateRef.current = null;
                  setIsDragging(false);
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
                    className="absolute inset-0 origin-top-left transition-transform duration-150"
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
                          className={edgeClass("marriage")}
                          stroke="currentColor"
                          strokeLinecap="round"
                        />
                      ))}
                      {parentChildGroups.map((group) => {
                        const children = group.childIds
                          .map((childId) => nodeMap.get(childId))
                          .filter(
                            (child): child is NonNullable<typeof child> =>
                              Boolean(child),
                          );
                        const parents = group.parentIds
                          .map((parentId) => nodeMap.get(parentId))
                          .filter(
                            (parent): parent is NonNullable<typeof parent> =>
                              Boolean(parent),
                          );

                        if (children.length === 0 || parents.length === 0) {
                          return null;
                        }

                        const parentCenters = parents.map((parent) => ({
                          x: parent.x + NODE_WIDTH / 2,
                          y: parent.y + NODE_HEIGHT,
                        }));
                        const railY = Math.max(...parentCenters.map((parent) => parent.y)) + 28;
                        const junctionX =
                          parentCenters.reduce((sum, parent) => sum + parent.x, 0) /
                          parentCenters.length;
                        const strokeClass = edgeClass(group.style);
                        const dashPattern =
                          group.style === "indirect" ? "8 8" : undefined;
                        const siblingRailY =
                          Math.min(...children.map((child) => child.y)) - 28;

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
                                  Math.abs(junctionX - (children[0].x + NODE_WIDTH / 2)) > 2
                                    ? `M ${junctionX} ${railY} H ${children[0].x + NODE_WIDTH / 2} V ${children[0].y}`
                                    : `M ${junctionX} ${railY} V ${children[0].y}`
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
                                    ...children.map((child) => child.x + NODE_WIDTH / 2),
                                  )} ${siblingRailY} H ${Math.max(
                                    ...children.map((child) => child.x + NODE_WIDTH / 2),
                                  )}`}
                                  className={strokeClass}
                                  stroke="currentColor"
                                  strokeDasharray={dashPattern}
                                  strokeLinecap="round"
                                />
                                {children.map((child, index) => (
                                  <path
                                    key={`${group.id}-child-${index}`}
                                    d={`M ${child.x + NODE_WIDTH / 2} ${siblingRailY} V ${child.y}`}
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

                    {tree.people.map((person) => {
                      const active = person.id === selectedPerson?.id;

                      return (
                        <button
                          key={person.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            selectPerson(person.id);
                          }}
                          className={nodeClass(person.accent, active)}
                          style={{ left: person.x, top: person.y }}
                        >
                          <div className="flex h-full flex-col items-center justify-between text-center">
                            <AvatarBadge
                              avatarLabel={person.avatarLabel}
                              photoUrl={person.photoUrl}
                              dominant
                            />
                            <div className="flex min-w-0 flex-1 flex-col items-center justify-end pt-4">
                              <span className="block max-w-full text-base font-semibold leading-5">
                                {person.primaryName}
                              </span>
                              <span className="mt-2 block max-w-full text-sm leading-5 text-slate-600">
                                {person.chineseTitle} / {person.englishTitle}
                              </span>
                              <span className="mt-3 block text-xs font-medium tracking-[0.04em] text-slate-500">
                                {person.years}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="hidden border-l border-slate-200/80 bg-slate-50/70 lg:block">
                <Tabs defaultValue="reviews" className="h-full">
                  <div className="border-b border-slate-200/80 px-4 py-3">
                    <TabsList variant="line">
                      <TabsTrigger value="reviews">Reviews</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                      <TabsTrigger value="legend">Legend</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="reviews" className="m-0 h-[640px]">
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
                                <p className="text-sm text-slate-700">
                                  {suggestion.label}
                                </p>
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
                  <TabsContent value="activity" className="m-0 h-[640px]">
                    <ScrollArea className="h-full px-4 py-4">
                      <div className="space-y-3">
                        {tree.activity.map((entry) => (
                          <Card
                            key={entry.id}
                            size="sm"
                            className="border-white/70 bg-white"
                          >
                            <CardContent className="space-y-1 px-4 py-4">
                              <p className="text-sm text-slate-700">
                                {entry.summary}
                              </p>
                              <p className="text-xs text-slate-500">
                                {entry.occurredAtLabel}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="legend" className="m-0 h-[640px]">
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
                          The visual system distinguishes lineage, marriage, and
                          indirect relationships first. The next backend pass can
                          map real relationship records directly into these edge
                          styles.
                        </p>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          <div className="hidden xl:block">
            <Card className="border-white/70 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
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
                        {selectedPerson?.primaryName}
                      </CardTitle>
                      <p className="mt-2 text-sm text-slate-600">
                        {selectedPerson?.chineseTitle} /{" "}
                        {selectedPerson?.englishTitle}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedPerson?.years}
                      </p>
                    </div>
                  </div>
                  <Button variant={directEdit ? "default" : "secondary"} size="sm">
                    {directEdit ? "Edit" : "Suggest"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Branch", selectedPerson?.branch ?? ""],
                    ["Years", selectedPerson?.years ?? ""],
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
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {value}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-950">
                      Details
                    </h3>
                    <Badge variant="secondary" className="rounded-md">
                      {directEdit ? "Direct edit" : "Suggestion flow"}
                    </Badge>
                  </div>
                  {selectedPerson ? (
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
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-950">
                      Path to you
                    </h3>
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
                    <h3 className="text-sm font-semibold text-slate-950">
                      Chinese title
                    </h3>
                    <Button variant="outline" size="sm">
                      Override
                    </Button>
                  </div>
                  <Card className="border-slate-200/80 bg-slate-50/80 shadow-none">
                    <CardContent className="px-4 py-4">
                      <p className="text-xl font-semibold text-slate-950">
                        {selectedPerson?.chineseTitle}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {selectedPerson?.englishTitle}. This stays visible beside
                        the path so users can connect the Chinese term to the
                        family structure.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-950">
                      Suggested AI action
                    </h3>
                    <Badge variant="secondary" className="rounded-md">
                      Confirmation required
                    </Badge>
                  </div>
                  <Card className="border-slate-200/80 bg-white shadow-none">
                    <CardContent className="space-y-4 px-4 py-4">
                      <p className="text-sm text-slate-700">
                        Add a title note: &quot;Use {selectedPerson?.chineseTitle} when
                        addressing {selectedPerson?.primaryName}.&quot;
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm">Approve</Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
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

function nodeClass(accent: PersonAccent, active: boolean) {
  const base =
    "absolute flex h-[248px] w-[208px] flex-col items-center justify-center overflow-hidden rounded-[28px] border px-4 py-4 text-center shadow-[0_18px_48px_rgba(15,23,42,0.16)] backdrop-blur transition duration-150";

  if (accent === "marriage") {
    return `${base} ${
      active
        ? "border-amber-300 bg-amber-50 text-amber-950 shadow-[0_22px_56px_rgba(245,158,11,0.2)]"
        : "border-amber-200 bg-white/94 text-slate-900 hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(15,23,42,0.18)]"
    }`;
  }

  if (accent === "step") {
    return `${base} ${
      active
        ? "border-sky-300 bg-sky-50 text-sky-950 shadow-[0_22px_56px_rgba(14,165,233,0.2)]"
        : "border-sky-200 bg-white/94 text-slate-900 hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(15,23,42,0.18)]"
    }`;
  }

  return `${base} ${
    active
      ? "border-emerald-300 bg-emerald-50 text-emerald-950 shadow-[0_22px_56px_rgba(16,185,129,0.2)]"
      : "border-emerald-200 bg-white/94 text-slate-900 hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(15,23,42,0.18)]"
  }`;
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

function buildSpouseEdges(tree: FamilyTreeSnapshot, nodeMap: ReturnType<typeof getNodeMap>) {
  return tree.relationships
    .filter((relationship) => relationship.type === "spouse")
    .map((relationship) => {
      const from = nodeMap.get(relationship.fromPersonId);
      const to = nodeMap.get(relationship.toPersonId);

      if (!from || !to) {
        return null;
      }

      const left = from.x <= to.x ? from : to;
      const right = from.x <= to.x ? to : from;

      return {
        id: relationship.id,
        x1: left.x + NODE_WIDTH,
        x2: right.x,
        y: left.y + NODE_HEIGHT / 2,
      };
    })
    .filter(
      (edge): edge is { id: string; x1: number; x2: number; y: number } =>
        Boolean(edge),
    );
}

function buildParentChildGroups(tree: FamilyTreeSnapshot) {
  const grouped = new Map<
    string,
    {
      id: string;
      childIds: string[];
      parentIds: string[];
      style: RelationshipStyle;
    }
  >();

  const childRelationships = new Map<string, FamilyTreeSnapshot["relationships"]>();

  for (const relationship of tree.relationships) {
    if (!isParentChildRelationship(relationship.type)) {
      continue;
    }

    const existing = childRelationships.get(relationship.toPersonId) ?? [];
    existing.push(relationship);
    childRelationships.set(relationship.toPersonId, existing);
  }

  for (const [childId, relationships] of childRelationships.entries()) {
    const biologicalParents = relationships
      .filter((relationship) => relationship.type === "biological_parent")
      .map((relationship) => relationship.fromPersonId)
      .sort();

    if (
      biologicalParents.length === 2 &&
      tree.relationships.some((relationship) => {
        return (
          relationship.type === "spouse" &&
          ((relationship.fromPersonId === biologicalParents[0] &&
            relationship.toPersonId === biologicalParents[1]) ||
            (relationship.fromPersonId === biologicalParents[1] &&
              relationship.toPersonId === biologicalParents[0]))
        );
      })
    ) {
      const key = `family:${biologicalParents.join("|")}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.childIds.push(childId);
      } else {
        grouped.set(key, {
          id: key,
          childIds: [childId],
          parentIds: biologicalParents,
          style: "blood",
        });
      }

      continue;
    }

    grouped.set(`child:${childId}`, {
      id: `child:${childId}`,
      childIds: [childId],
      parentIds: relationships.map((relationship) => relationship.fromPersonId),
      style: relationships.some((relationship) => relationship.style === "indirect")
        ? "indirect"
        : "blood",
    });
  }

  return Array.from(grouped.values()).map((group) => ({
    ...group,
    childIds: group.childIds.sort(),
  }));
}

function isParentChildRelationship(type: RelationshipType) {
  return (
    type === "biological_parent" ||
    type === "adoptive_parent" ||
    type === "step_parent" ||
    type === "guardian"
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

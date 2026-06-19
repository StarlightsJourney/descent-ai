import { demoTree } from "@/lib/family-tree/mock-data";
import {
  canDirectEdit,
  getDisplayPathLabels,
  getNodeMap,
  getSelectedPerson,
  getViewerEditRoute,
} from "@/lib/family-tree/selectors";
import type {
  PersonAccent,
  RelationshipStyle,
} from "@/lib/family-tree/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Bot,
  Clock3,
  Expand,
  GitBranch,
  LayoutPanelTop,
  Move,
  Search,
  ShieldCheck,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

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
    "absolute w-44 rounded-lg border px-4 py-3 text-left shadow-[0_16px_40px_rgba(15,23,42,0.16)] backdrop-blur";

  if (accent === "marriage") {
    return `${base} ${
      active
        ? "border-amber-300 bg-amber-50 text-amber-950"
        : "border-amber-200 bg-white/92 text-slate-900"
    }`;
  }

  if (accent === "step") {
    return `${base} ${
      active
        ? "border-sky-300 bg-sky-50 text-sky-950"
        : "border-sky-200 bg-white/90 text-slate-900"
    }`;
  }

  return `${base} ${
    active
      ? "border-emerald-300 bg-emerald-50 text-emerald-950"
      : "border-emerald-200 bg-white/92 text-slate-900"
  }`;
}

export default function Home() {
  const tree = demoTree;
  const selectedPerson = getSelectedPerson(tree);
  const nodeMap = getNodeMap(tree);
  const pathLabels = getDisplayPathLabels(tree);
  const directEdit = canDirectEdit(tree.viewerRole);
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
    { label: "Zoom out", value: "-", icon: ZoomOut },
    { label: "Pan mode", value: "100%", icon: Move },
    { label: "Zoom in", value: "+", icon: ZoomIn },
    { label: "Fit tree", value: "Fit", icon: Expand },
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
                      defaultValue={selectedPerson?.primaryName ?? ""}
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 pl-9 shadow-none"
                      placeholder="Find a relative"
                    />
                  </div>
                  <div className="min-w-0 flex-[1.35]">
                    <Command className="rounded-lg border border-slate-200 bg-slate-50 p-0 shadow-none">
                      <CommandInput placeholder="Describe a change or query" />
                      <CommandList className="max-h-36">
                        <CommandEmpty>No matching action.</CommandEmpty>
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
                  {zoomControls.map(({ icon: Icon, label, value }) => (
                    <Tooltip key={label}>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="outline"
                            size={value === "Fit" ? "sm" : "icon-sm"}
                          />
                        }
                      >
                        <Icon className="size-4" />
                        {value === "Fit" ? <span>{value}</span> : null}
                      </TooltipTrigger>
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  ))}
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
                          {selectedPerson?.chineseTitle} · {selectedPerson?.englishTitle}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="px-4 pb-4">
                        <MobileDetails
                          branch={selectedPerson?.branch ?? ""}
                          years={selectedPerson?.years ?? ""}
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
              <div className="relative overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.22)_1px,transparent_0)] [background-size:28px_28px]">
                <div className="relative h-[760px] min-w-[980px]">
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 980 760"
                    fill="none"
                    aria-hidden="true"
                  >
                    {tree.relationships.map((relationship) => {
                      const from = nodeMap.get(relationship.fromPersonId);
                      const to = nodeMap.get(relationship.toPersonId);

                      if (!from || !to) {
                        return null;
                      }

                      const x1 = from.x + 88;
                      const y1 = from.y + 64;
                      const x2 = to.x + 88;
                      const y2 = to.y;
                      const midY = y1 + (y2 - y1) / 2;

                      return (
                        <path
                          key={relationship.id}
                          d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                          className={edgeClass(relationship.style)}
                          stroke="currentColor"
                          strokeDasharray={
                            relationship.style === "indirect" ? "8 8" : undefined
                          }
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </svg>

                  {tree.people.map((person) => {
                    const active = person.id === selectedPerson?.id;

                    return (
                      <button
                        key={person.id}
                        className={nodeClass(person.accent, active)}
                        style={{ left: person.x, top: person.y }}
                      >
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          {person.branch}
                        </span>
                        <span className="mt-2 block text-base font-semibold">
                          {person.primaryName}
                        </span>
                        <span className="mt-1 block text-sm text-slate-600">
                          {person.chineseTitle}
                        </span>
                        <span className="mt-3 block text-xs text-slate-500">
                          {person.years}
                        </span>
                      </button>
                    );
                  })}
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
                          indirect relationships first. More detailed relationship
                          styling can layer on top of this once the backend data and
                          approval flow are wired in.
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
                  <div>
                    <CardDescription>Selected person</CardDescription>
                    <CardTitle className="mt-1 text-2xl">
                      {selectedPerson?.primaryName}
                    </CardTitle>
                    <p className="mt-2 text-sm text-slate-600">
                      {selectedPerson?.chineseTitle} · {selectedPerson?.englishTitle}
                    </p>
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
                      Path to you
                    </h3>
                    <Badge variant="secondary" className="rounded-md">
                      Chinese v1
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {pathLabels.map((step, index) => (
                      <div key={`${step}-${index}`} className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
                          {step}
                        </span>
                        {index < pathLabels.length - 1 ? (
                          <span className="text-slate-400">→</span>
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
                        the path so users can connect the Chinese term to the family
                        structure.
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
        className={
          dashed
            ? `h-0 w-10 ${tone}`
            : `h-0.5 w-10 rounded-full ${tone}`
        }
      />
      <span>{label}</span>
    </div>
  );
}

function MobileDetails({
  branch,
  years,
  viewerRole,
  editRoute,
  pathLabels,
  chineseTitle,
  englishTitle,
}: {
  branch: string;
  years: string;
  viewerRole: string;
  editRoute: string;
  pathLabels: string[];
  chineseTitle: string;
  englishTitle: string;
}) {
  return (
    <div className="space-y-6">
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
        <h3 className="text-sm font-semibold text-slate-950">Path to you</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {pathLabels.map((step, index) => (
            <div key={`${step}-${index}`} className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
                {step}
              </span>
              {index < pathLabels.length - 1 ? (
                <span className="text-slate-400">→</span>
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

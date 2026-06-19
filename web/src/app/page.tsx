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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f8fb_0%,#eef2f7_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 sm:px-5 lg:px-6">
        <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white">
                D
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Private family workspace
                </p>
                <h1 className="text-2xl font-semibold text-slate-950">
                  {tree.name}
                </h1>
              </div>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              {tree.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              [`${tree.stats.peopleCount} people`, "Current tree"],
              [`${tree.stats.pendingSuggestionCount} pending`, "Suggestions"],
              [`${tree.stats.editorCount} editors`, "Write access"],
              [tree.stats.liveSync ? "Live sync" : "Sync offline", "Realtime"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-lg border border-slate-200 bg-white/78 px-3 py-3"
              >
                <p className="text-sm font-semibold text-slate-950">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="mt-4 grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-h-[720px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-sm text-slate-400">Search</span>
                  <input
                    aria-label="Search people"
                    defaultValue={selectedPerson?.primaryName ?? ""}
                    className="w-full min-w-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                    placeholder="Find a relative"
                  />
                </label>
                <label className="flex min-w-0 flex-[1.2] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-sm text-slate-400">Command</span>
                  <input
                    aria-label="AI command"
                    defaultValue="Show grandfather's younger brother and my relationship path"
                    className="w-full min-w-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                    placeholder="Describe a change or query"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                {["-", "100%", "+", "Fit"].map((control) => (
                  <button
                    key={control}
                    className="h-10 min-w-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {control}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
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
                        <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
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

              <aside className="border-t border-slate-200 bg-slate-50/80 lg:border-t-0 lg:border-l">
                <div className="space-y-5 p-4">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-slate-950">
                        Relationship legend
                      </h2>
                      <button className="text-xs font-medium text-slate-500">
                        Theme
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-3">
                        <span className="h-0.5 w-10 bg-emerald-500" />
                        <span>Blood lineage</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="h-0.5 w-10 bg-amber-500" />
                        <span>Marriage</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="h-0.5 w-10 border-t-2 border-dashed border-slate-500" />
                        <span>Indirect or inactive relationship</span>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-slate-950">
                        Pending reviews
                      </h2>
                      <button className="text-xs font-medium text-slate-500">
                        See all
                      </button>
                    </div>
                    <div className="space-y-2">
                      {tree.suggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"
                        >
                          {suggestion.label}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-slate-950">
                        Recent activity
                      </h2>
                      <button className="text-xs font-medium text-slate-500">
                        Audit log
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      {tree.activity.map((entry) => (
                        <p key={entry.id}>
                          {entry.summary} {entry.occurredAtLabel}
                        </p>
                      ))}
                    </div>
                  </section>
                </div>
              </aside>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Selected person
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  {selectedPerson?.primaryName}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedPerson?.chineseTitle} · {selectedPerson?.englishTitle}
                </p>
              </div>
              <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                {directEdit ? "Edit" : "Suggest"}
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Branch", selectedPerson?.branch ?? ""],
                ["Years", selectedPerson?.years ?? ""],
                ["Viewer role", tree.viewerRole],
                ["Edit route", getViewerEditRoute(tree.viewerRole)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <p className="text-xs uppercase text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <section className="mt-6">
              <h3 className="text-sm font-semibold text-slate-950">
                Path to you
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
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
            </section>

            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-950">
                  Chinese title
                </h3>
                <button className="text-xs font-medium text-slate-500">
                  Override
                </button>
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xl font-semibold text-slate-950">
                  {selectedPerson?.chineseTitle}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {selectedPerson?.englishTitle}. This stays visible beside the
                  path so users can connect the Chinese term to the family
                  structure.
                </p>
              </div>
            </section>

            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-950">
                  Suggested AI action
                </h3>
                <button className="text-xs font-medium text-slate-500">
                  Review queue
                </button>
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-700">
                  Add a title note: &quot;Use {selectedPerson?.chineseTitle} when
                  addressing {selectedPerson?.primaryName}.&quot;
                </p>
                <div className="mt-4 flex gap-2">
                  <button className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white">
                    Approve
                  </button>
                  <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                    Edit
                  </button>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

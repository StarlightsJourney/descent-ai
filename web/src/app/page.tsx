import Link from "next/link";

import { signOutAction } from "@/app/auth/actions";
import { FamilyTreeWorkspace } from "@/components/family-tree-workspace";
import { Button } from "@/components/ui/button";
import { loadHomeViewModel } from "@/lib/home/load-home-view-model";

export default async function Home() {
  const model = await loadHomeViewModel();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5efe5_0%,#e2e8f0_36%,#dce6ef_100%)]">
      <StatusBanner source={model.source} userEmail={model.userEmail} />
      <header className="mx-auto flex max-w-[1600px] items-center justify-between px-4 pt-4 sm:px-5 lg:px-6">
        <div className="text-sm text-slate-600">
          {model.userEmail ? (
            <span>Signed in as <span className="font-medium text-slate-900">{model.userEmail}</span></span>
          ) : (
            <span>Browsing with the demo experience</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {model.userEmail ? (
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          ) : (
            <Button render={<Link href="/sign-in" />} size="sm">
              Sign in
            </Button>
          )}
        </div>
      </header>
      <FamilyTreeWorkspace initialTree={model.tree} />
    </div>
  );
}

function StatusBanner({
  source,
  userEmail,
}: {
  source: "demo-unconfigured" | "demo-guest" | "demo-unseeded" | "live";
  userEmail: string | null;
}) {
  if (source === "live") {
    return (
      <div className="border-b border-emerald-200/70 bg-emerald-50/90">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 text-sm sm:px-5 lg:px-6">
          <p className="text-emerald-900">
            Live Supabase data is active for <span className="font-medium">{userEmail}</span>.
          </p>
          <p className="text-emerald-700">Tree reads are coming from your hosted backend.</p>
        </div>
      </div>
    );
  }

  if (source === "demo-unconfigured") {
    return (
      <div className="border-b border-amber-200/70 bg-amber-50/90">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 text-sm sm:px-5 lg:px-6">
          <p className="text-amber-950">
            Demo mode is active because Supabase environment values are not configured locally.
          </p>
          <Button render={<Link href="/sign-in" />} variant="outline" size="sm">
            View sign-in setup
          </Button>
        </div>
      </div>
    );
  }

  if (source === "demo-unseeded") {
    return (
      <div className="border-b border-sky-200/70 bg-sky-50/90">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 text-sm sm:px-5 lg:px-6">
          <p className="text-sky-950">
            Signed in as <span className="font-medium">{userEmail}</span>, but no active seeded tree membership matched this session.
          </p>
          <p className="text-sky-700">The workspace is still falling back to demo data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-stone-200/80 bg-stone-50/90">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 text-sm sm:px-5 lg:px-6">
        <p className="text-stone-900">
          You are viewing the demo tree. Sign in to switch to the live Supabase-backed workspace.
        </p>
        <Button render={<Link href="/sign-in" />} variant="outline" size="sm">
          Sign in
        </Button>
      </div>
    </div>
  );
}

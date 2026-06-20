import Link from "next/link";
import { redirect } from "next/navigation";

import { signInAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const ERROR_MESSAGES: Record<string, string> = {
  missing_credentials: "Email and password are both required.",
  Invalid_login_credentials: "The email or password is incorrect.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f4efe6_0%,#e8dcc8_100%)] px-4 py-10 text-slate-950">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
          <Card className="w-full border-stone-200/80 bg-white/90 shadow-[0_30px_80px_rgba(68,40,24,0.12)]">
            <CardHeader className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Supabase not configured
              </p>
              <CardTitle className="text-3xl">Sign-in is not live yet</CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6 text-stone-600">
                Add the Supabase environment values in `web/.env.local`, then come back here.
                Until then, the home page will continue rendering the local demo tree.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button render={<Link href="/" />} size="lg">
                Return to workspace
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const error = params.error ? ERROR_MESSAGES[params.error] ?? params.error : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f7efe1_0%,#f1e6d5_35%,#e6d4bb_100%)] px-4 py-10 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.15fr_minmax(0,440px)]">
        <section className="rounded-[2rem] border border-white/50 bg-[linear-gradient(160deg,rgba(113,63,18,0.96)_0%,rgba(67,56,202,0.12)_100%)] p-8 text-stone-50 shadow-[0_30px_100px_rgba(68,40,24,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/90">
            Descent workspace access
          </p>
          <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight">
            Sign in to switch from the demo tree to your live family graph.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-200">
            The app already knows how to read from Supabase. Once your hosted project, schema,
            and seeded membership are ready, this sign-in flow becomes the handoff from the mock
            shell to the real tree.
          </p>
          <div className="mt-10 grid gap-3 text-sm text-stone-100 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/12 bg-white/6 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-amber-200/80">Mode</p>
              <p className="mt-2 font-medium">Live session</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/6 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-amber-200/80">Source</p>
              <p className="mt-2 font-medium">Supabase-backed tree</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/6 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-amber-200/80">Fallback</p>
              <p className="mt-2 font-medium">Demo snapshot stays available</p>
            </div>
          </div>
        </section>

        <Card className="border-stone-200/80 bg-white/92 shadow-[0_30px_90px_rgba(68,40,24,0.14)]">
          <CardHeader className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Account sign-in
            </p>
            <CardTitle className="text-3xl">Continue to your family tree</CardTitle>
            <CardDescription className="text-sm leading-6 text-stone-600">
              Use the email and password for the Supabase auth user you created during setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form action={signInAction} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-800" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 rounded-xl border-stone-200 bg-stone-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-800" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-11 rounded-xl border-stone-200 bg-stone-50"
                />
              </div>

              <Button type="submit" size="lg" className="h-11 w-full rounded-xl bg-stone-900 text-white hover:bg-stone-800">
                Sign in
              </Button>
            </form>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
              If your hosted project is not ready yet, you can still browse the mock workspace from{" "}
              <Link href="/" className="font-medium text-stone-900 underline underline-offset-4">
                the home page
              </Link>
              .
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

import { cache } from "react";

import { getDefaultTreeSlug, isSupabaseConfigured } from "@/lib/env";
import { demoTree } from "@/lib/family-tree/mock-data";
import { buildFamilyTreeSnapshot } from "@/lib/family-tree/read-model";
import type { FamilyTreeSnapshot } from "@/lib/family-tree/types";
import { createClient } from "@/lib/supabase/server";

type DataSourceState = "demo-unconfigured" | "demo-guest" | "demo-unseeded" | "live";

export type HomeViewModel = {
  tree: FamilyTreeSnapshot;
  source: DataSourceState;
  userEmail: string | null;
};

type MembershipWithTree = {
  created_at: string;
  family_tree: {
    created_at: string;
    created_by_user_id: string;
    description: string | null;
    id: string;
    name: string;
    slug: string;
    updated_at: string;
  };
  family_tree_id: string;
  id: string;
  person_id: string | null;
  role: "contributor" | "editor" | "admin";
  status: "active" | "invited" | "disabled";
  updated_at: string;
  user_id: string;
};

export const loadHomeViewModel = cache(async (): Promise<HomeViewModel> => {
  if (!isSupabaseConfigured()) {
    return {
      tree: demoTree,
      source: "demo-unconfigured",
      userEmail: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      tree: demoTree,
      source: "demo-guest",
      userEmail: null,
    };
  }

  const membership = await loadActiveMembership(supabase, user.id);

  if (!membership) {
    return {
      tree: demoTree,
      source: "demo-unseeded",
      userEmail: user.email ?? null,
    };
  }

  const [{ data: people }, { data: relationships }, { data: suggestions }, { data: activity }] =
    await Promise.all([
      supabase
        .from("people")
        .select("*")
        .eq("family_tree_id", membership.family_tree.id)
        .order("generation_index", { ascending: true, nullsFirst: false })
        .order("primary_name", { ascending: true }),
      supabase
        .from("relationships")
        .select("*")
        .eq("family_tree_id", membership.family_tree.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("suggested_edits")
        .select("*")
        .eq("family_tree_id", membership.family_tree.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("activity_logs")
        .select("*")
        .eq("family_tree_id", membership.family_tree.id)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  if (!people || !relationships || !suggestions || !activity) {
    return {
      tree: demoTree,
      source: "demo-unseeded",
      userEmail: user.email ?? null,
    };
  }

  const snapshot = buildFamilyTreeSnapshot({
    membership,
    tree: membership.family_tree,
    people,
    relationships,
    suggestions,
    activity,
  });

  if (!snapshot) {
    return {
      tree: demoTree,
      source: "demo-unseeded",
      userEmail: user.email ?? null,
    };
  }

  return {
    tree: snapshot,
    source: "live",
    userEmail: user.email ?? null,
  };
});

async function loadActiveMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const defaultTreeSlug = getDefaultTreeSlug();

  const { data } = await supabase
    .from("memberships")
    .select(
      `
        *,
        family_tree:family_trees!inner (
          id,
          name,
          slug,
          description,
          created_by_user_id,
          created_at,
          updated_at
        )
      `,
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .returns<MembershipWithTree[]>();

  if (!data?.length) {
    return null;
  }

  if (!defaultTreeSlug) {
    return data[0] ?? null;
  }

  return data.find((membership) => membership.family_tree.slug === defaultTreeSlug) ?? null;
}

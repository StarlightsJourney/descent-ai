"use server";

import { revalidatePath } from "next/cache";

import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type PersonDetailsActionState = {
  status: "idle" | "success" | "error";
  message: string;
  mode: "direct" | "suggestion" | null;
  submissionId: string | null;
  submittedValues: {
    bio: string;
    currentPlace: string;
  } | null;
};

export async function savePersonDetailsAction(
  _previousState: PersonDetailsActionState,
  formData: FormData,
): Promise<PersonDetailsActionState> {
  try {
    const familyTreeId = String(formData.get("familyTreeId") ?? "").trim();
    const personId = String(formData.get("personId") ?? "").trim();
    const bio = normalizeOptionalText(formData.get("bio"));
    const currentPlace = normalizeOptionalText(formData.get("currentPlace"));

    if (!familyTreeId || !personId) {
      return createPersonDetailsActionState(
        "error",
        "Missing person context for this change.",
        null,
        null,
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createPersonDetailsActionState(
        "error",
        "Sign in is required before saving or suggesting changes.",
        null,
        null,
      );
    }

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("role")
      .eq("family_tree_id", familyTreeId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .returns<TreeMembershipRow[]>()
      .maybeSingle();

    if (membershipError || !membership) {
      return createPersonDetailsActionState(
        "error",
        "No active membership was found for this tree.",
        null,
        null,
      );
    }

    const mode = getPersonDetailsMode(membership.role);

    if (!mode) {
      return createPersonDetailsActionState(
        "error",
        "This role cannot submit person detail changes.",
        null,
        null,
      );
    }

    const { data: person, error: personError } = await supabase
      .from("people")
      .select("id, family_tree_id, primary_name, bio, current_place")
      .eq("id", personId)
      .eq("family_tree_id", familyTreeId)
      .returns<PersonDetailsRow[]>()
      .maybeSingle();

    if (personError || !person) {
      return createPersonDetailsActionState(
        "error",
        "The selected person could not be loaded for editing.",
        mode,
        null,
      );
    }

    const before = {
      bio: person.bio,
      current_place: person.current_place,
    };
    const after: PersonDetailsUpdate = {
      bio,
      current_place: currentPlace,
    };

    if (before.bio === after.bio && before.current_place === after.current_place) {
      return createPersonDetailsActionState(
        "success",
        "No changes were detected for this person.",
        mode,
        toSubmittedValues(after),
      );
    }

    if (mode === "direct") {
      const { error: updateError } = await supabase
        .from("people")
        .update(after as never)
        .eq("id", personId)
        .eq("family_tree_id", familyTreeId);

      if (updateError) {
        return createPersonDetailsActionState(
          "error",
          "Saving the live person details failed.",
          mode,
          null,
        );
      }

      const activityLogInsert: Database["public"]["Tables"]["activity_logs"]["Insert"] = {
        family_tree_id: familyTreeId,
        actor_user_id: user.id,
        entity_type: "person",
        entity_id: personId,
        action: "updated_details",
        summary: `Updated details for ${person.primary_name}`,
        before_json: before,
        after_json: after,
      };

      await supabase.from("activity_logs").insert([activityLogInsert] as never);

      revalidatePath("/");

      return createPersonDetailsActionState(
        "success",
        `Saved live changes for ${person.primary_name}.`,
        mode,
        toSubmittedValues(after),
      );
    }

    const suggestionPayload: Database["public"]["Tables"]["suggested_edits"]["Insert"] = {
      family_tree_id: familyTreeId,
      proposed_by_user_id: user.id,
      target_entity_type: "person",
      target_entity_id: personId,
      action_type: "update_person_details",
      proposed_change_json: {
        personName: person.primary_name,
        before,
        after,
      },
      status: "pending",
    };

    const { error: suggestionError } = await supabase
      .from("suggested_edits")
      .insert([suggestionPayload] as never);

    if (suggestionError) {
      return createPersonDetailsActionState(
        "error",
        "Submitting the suggestion failed.",
        mode,
        null,
      );
    }

    revalidatePath("/");

    return createPersonDetailsActionState(
      "success",
      `Submitted a details suggestion for ${person.primary_name}.`,
      mode,
      toSubmittedValues(after),
    );
  } catch {
    return createPersonDetailsActionState(
      "error",
      "The person details change could not be completed.",
      null,
      null,
    );
  }
}

type PersonDetailsRow = Pick<
  Database["public"]["Tables"]["people"]["Row"],
  "id" | "family_tree_id" | "primary_name" | "bio" | "current_place"
>;

type TreeMembershipRow = Pick<
  Database["public"]["Tables"]["memberships"]["Row"],
  "role"
>;

type PersonDetailsUpdate = {
  bio: Database["public"]["Tables"]["people"]["Row"]["bio"];
  current_place: Database["public"]["Tables"]["people"]["Row"]["current_place"];
};

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function getPersonDetailsMode(role: TreeMembershipRow["role"]): PersonDetailsActionState["mode"] {
  if (role === "editor" || role === "admin") {
    return "direct";
  }

  if (role === "contributor") {
    return "suggestion";
  }

  return null;
}

function createPersonDetailsActionState(
  status: PersonDetailsActionState["status"],
  message: string,
  mode: PersonDetailsActionState["mode"],
  submittedValues: PersonDetailsActionState["submittedValues"],
): PersonDetailsActionState {
  return {
    status,
    message,
    mode,
    submissionId: crypto.randomUUID(),
    submittedValues,
  };
}

function toSubmittedValues(values: {
  bio: string | null;
  current_place: string | null;
}): PersonDetailsActionState["submittedValues"] {
  return {
    bio: values.bio ?? "",
    currentPlace: values.current_place ?? "",
  };
}

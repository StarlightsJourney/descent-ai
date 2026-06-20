"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type PersonDetailsActionState,
  savePersonDetailsAction,
} from "@/app/tree-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ViewerRole } from "@/lib/family-tree/types";

const INITIAL_STATE: PersonDetailsActionState = {
  status: "idle",
  message: "",
  mode: null,
  submissionId: null,
  submittedValues: null,
};

export function PersonDetailsForm({
  familyTreeId,
  personId,
  primaryName,
  bio,
  currentPlace,
  viewerRole,
}: {
  familyTreeId: string;
  personId: string;
  primaryName: string;
  bio: string;
  currentPlace: string;
  viewerRole: ViewerRole;
}) {
  return (
    <PersonDetailsFormInner
      key={`${personId}:${bio}:${currentPlace}:${viewerRole}`}
      familyTreeId={familyTreeId}
      personId={personId}
      primaryName={primaryName}
      bio={bio}
      currentPlace={currentPlace}
      viewerRole={viewerRole}
    />
  );
}

function PersonDetailsFormInner({
  familyTreeId,
  personId,
  primaryName,
  bio,
  currentPlace,
  viewerRole,
}: {
  familyTreeId: string;
  personId: string;
  primaryName: string;
  bio: string;
  currentPlace: string;
  viewerRole: ViewerRole;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    savePersonDetailsAction,
    INITIAL_STATE,
  );
  const [draftBio, setDraftBio] = useState(bio);
  const [draftCurrentPlace, setDraftCurrentPlace] = useState(currentPlace);
  const [dismissedSubmissionId, setDismissedSubmissionId] = useState<string | null>(null);
  const canSubmit = viewerRole === "contributor" || viewerRole === "editor" || viewerRole === "admin";
  const directEdit = viewerRole === "editor" || viewerRole === "admin";
  const stateSubmissionId = state.submissionId;
  const baseline = state.status === "success" && state.submittedValues
    ? state.submittedValues
    : { bio, currentPlace };

  const hasChanges =
    normalizeClientText(draftBio) !== normalizeClientText(baseline.bio) ||
    normalizeClientText(draftCurrentPlace) !== normalizeClientText(baseline.currentPlace);

  useEffect(() => {
    if (state.status === "success" && state.mode === "direct") {
      router.refresh();
    }
  }, [router, state.mode, state.status]);

  const showActionMessage =
    !pending &&
    Boolean(state.message) &&
    stateSubmissionId !== null &&
    dismissedSubmissionId !== stateSubmissionId;

  const statusMessage = pending
    ? directEdit
      ? `Saving live changes for ${primaryName}...`
      : `Submitting a suggestion for ${primaryName}...`
    : showActionMessage
      ? state.message
      : "";

  const statusTone = pending
    ? "text-slate-600"
    : state.status === "error"
      ? "text-rose-700"
      : "text-emerald-700";

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(event) => {
        if (!canSubmit) {
          event.preventDefault();
          return;
        }

        if (!hasChanges) {
          event.preventDefault();
          return;
        }

        const confirmed = window.confirm(
          directEdit
            ? `Save live changes for ${primaryName}?`
            : `Submit these changes for ${primaryName} as a suggestion?`,
        );

        if (!confirmed) {
          event.preventDefault();
          return;
        }
        setDismissedSubmissionId(null);
      }}
    >
      <input type="hidden" name="familyTreeId" value={familyTreeId} />
      <input type="hidden" name="personId" value={personId} />

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-950" htmlFor={`bio-${personId}`}>
          Description
        </label>
        <Textarea
          id={`bio-${personId}`}
          name="bio"
          value={draftBio}
          placeholder="Add a short description or family context."
          rows={4}
          disabled={!canSubmit || pending}
          onChange={(event) => {
            if (stateSubmissionId) {
              setDismissedSubmissionId(stateSubmissionId);
            }

            setDraftBio(event.target.value);
          }}
        />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-slate-950"
          htmlFor={`current-place-${personId}`}
        >
          Personal note
        </label>
        <Textarea
          id={`current-place-${personId}`}
          name="currentPlace"
          value={draftCurrentPlace}
          placeholder="Add where this relative currently lives or spends most of their time."
          rows={3}
          disabled={!canSubmit || pending}
          onChange={(event) => {
            if (stateSubmissionId) {
              setDismissedSubmissionId(stateSubmissionId);
            }

            setDraftCurrentPlace(event.target.value);
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs leading-5 text-slate-500">
          {directEdit
            ? "Editors and admins write directly to the live tree after confirmation."
            : canSubmit
              ? "Contributors submit a suggestion for review instead of mutating live data."
              : "Sign in with contributor access or higher to change this person."}
        </p>
        <Button type="submit" size="sm" disabled={!canSubmit || pending || !hasChanges}>
          {pending
            ? directEdit
              ? "Saving..."
              : "Submitting..."
            : !hasChanges
              ? "No changes"
            : directEdit
              ? "Save details"
              : "Suggest details"}
        </Button>
      </div>

      {statusMessage ? (
        <p
          aria-live="polite"
          className={`text-sm ${statusTone}`}
        >
          {statusMessage}
        </p>
      ) : null}
    </form>
  );
}

function normalizeClientText(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : "";
}

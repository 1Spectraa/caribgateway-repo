"use client";

import { useActionState } from "react";

type ActionState = { error: string } | null;
type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Delete control for admin list rows. Takes a bound server action, e.g.
 * deleteCountry.bind(null, id), and asks for confirmation before submitting.
 */
export default function DeleteRecordButton({
  name,
  action,
}: {
  name: string;
  action: Action;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) e.preventDefault();
      }}
    >
      {state?.error && <span className="text-xs text-red-500 mr-2">{state.error}</span>}
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { deleteBusiness, type ActionState } from "@/lib/actions/businesses";

export default function DeleteBusinessButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const deleteWithId = deleteBusiness.bind(null, id);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    deleteWithId,
    null,
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`))
          e.preventDefault();
      }}
    >
      {state?.error && (
        <span className="text-xs text-red-500 mr-2">{state.error}</span>
      )}
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

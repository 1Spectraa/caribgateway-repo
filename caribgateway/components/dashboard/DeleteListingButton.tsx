"use client";

import { useActionState } from "react";
import { keepFieldsOnSubmit } from "@/components/admin/keep-fields";
import { Icon } from "@/components/dashboard/icons";
import { Notice, buttonClass } from "@/components/dashboard/ui";
import { deleteBusiness, type ActionState } from "@/lib/actions/businesses";

/**
 * Deletes a listing after a confirmation. Only its owner or an administrator may, and the
 * server checks again. Afterwards the person is sent back to their listings.
 */
export default function DeleteListingButton({ id, name }: { id: string; name: string }) {
  const deleteWithId = deleteBusiness.bind(null, id);
  const [state, deleteAction, deleting] = useActionState<ActionState, FormData>(deleteWithId, null);

  return (
    <form
      className="flex flex-col items-start gap-2"
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) {
          event.preventDefault();
          return;
        }
        keepFieldsOnSubmit(deleteAction)(event);
      }}
    >
      <input type="hidden" name="return_to" value="/dashboard/listings" />
      <button type="submit" disabled={deleting} className={buttonClass("danger")}>
        <Icon name="trash" className="h-4 w-4" />
        {deleting ? "Deleting…" : "Delete"}
      </button>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
    </form>
  );
}

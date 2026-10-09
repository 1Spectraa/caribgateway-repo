"use client";

import { useState, useTransition } from "react";
import { setListingOnline, submitListing, type ListingActionState } from "@/lib/actions/listings";

type Props = {
  businessId: string;
  status: "draft" | "pending" | "published" | "archived";
  online: boolean;
  /** Owners and administrators can switch an approved listing on or off. */
  canToggle: boolean;
  /** Anyone who can edit the listing can send a draft for approval. */
  canSubmit: boolean;
};

const BUTTON =
  "text-xs font-medium px-2.5 py-1 rounded border disabled:opacity-50 whitespace-nowrap";

/** Send-for-approval and on/off controls for one listing row. Results refresh the page. */
export default function ListingStatusControls({ businessId, status, online, canToggle, canSubmit }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ListingActionState>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
    });
  }

  const showSubmit = canSubmit && status === "draft";
  const showToggle = canToggle && status === "published";
  if (!showSubmit && !showToggle) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {error && <span className="text-xs text-red-500">{error}</span>}
      {showSubmit && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => submitListing(businessId))}
          className={`${BUTTON} border-gray-900 bg-gray-900 text-white hover:bg-gray-700`}
        >
          {pending ? "Sending…" : "Send for approval"}
        </button>
      )}
      {showToggle && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setListingOnline(businessId, !online))}
          className={`${BUTTON} ${
            online
              ? "border-gray-300 text-gray-700 hover:border-gray-500"
              : "border-green-600 text-green-700 hover:bg-green-50"
          }`}
        >
          {pending ? "Saving…" : online ? "Turn off" : "Turn on"}
        </button>
      )}
    </div>
  );
}

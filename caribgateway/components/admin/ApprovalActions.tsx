"use client";

import { useActionState, useState, useTransition } from "react";
import { approveListing, rejectListing, type ListingActionState } from "@/lib/actions/listings";

/** Approve, or send back with a note, for one listing waiting on an administrator. */
export default function ApprovalActions({ businessId }: { businessId: string }) {
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approving, startApprove] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const rejectWithId = rejectListing.bind(null, businessId);
  const [rejectState, rejectAction, rejecting] = useActionState<ListingActionState, FormData>(
    rejectWithId,
    null,
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={approving || rejecting}
          onClick={() => {
            setApproveError(null);
            startApprove(async () => {
              const result = await approveListing(businessId);
              if (result?.error) setApproveError(result.error);
            });
          }}
          className="text-xs font-medium px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {approving ? "Approving…" : "Approve and publish"}
        </button>
        <button
          type="button"
          onClick={() => setShowReject((open) => !open)}
          aria-expanded={showReject}
          className="text-xs font-medium px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:border-gray-500"
        >
          {showReject ? "Cancel" : "Ask for changes"}
        </button>
        {approveError && <span className="text-xs text-red-500">{approveError}</span>}
      </div>

      {showReject && (
        <form action={rejectAction} className="space-y-2">
          {rejectState?.error && <p className="text-xs text-red-500">{rejectState.error}</p>}
          <label className="block text-xs font-medium text-gray-700" htmlFor={`note-${businessId}`}>
            What should the operator change?
          </label>
          <textarea
            id={`note-${businessId}`}
            name="note"
            rows={2}
            required
            minLength={5}
            maxLength={1000}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={rejecting}
            className="text-xs font-medium px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {rejecting ? "Sending…" : "Send back to draft"}
          </button>
        </form>
      )}
    </div>
  );
}

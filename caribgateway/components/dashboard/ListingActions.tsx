"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setListingOnline, submitListing } from "@/lib/actions/listings";
import { buttonClass, cx } from "@/components/dashboard/ui";

/** Shows the listing to visitors, or hides it. Changes at once, and steps back if the save fails. */
export function LiveSwitch({ businessId, online }: { businessId: string; online: boolean }) {
  const [shownOnline, setShownOnline] = useOptimistic(online);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !shownOnline;
    setError(null);
    startTransition(async () => {
      setShownOnline(next);
      const result = await setListingOnline(businessId, next);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          role="switch"
          aria-checked={shownOnline}
          aria-label={shownOnline ? "Showing on the site. Switch off" : "Hidden from the site. Switch on"}
          disabled={pending}
          onClick={toggle}
          className={cx(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal disabled:opacity-60",
            shownOnline ? "bg-brand-teal" : "bg-slate-300",
          )}
        >
          <span
            aria-hidden="true"
            className={cx(
              "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
              shownOnline ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
        <span className="text-sm font-medium text-slate-700">{shownOnline ? "On the site" : "Hidden"}</span>
      </div>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}

/** Sends a draft to the admin team for review. The listing stays hidden until it is approved. */
export function SendForApprovalButton({ businessId, className }: { businessId: string; className?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await submitListing(businessId);
            if (result?.error) setError(result.error);
          });
        }}
        className={buttonClass("primary", className)}
      >
        {pending ? "Sending…" : "Send for approval"}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}

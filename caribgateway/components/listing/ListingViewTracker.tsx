"use client";

import { useEffect, useRef } from "react";
import { recordListingEvent } from "@/lib/actions/listing-events";

/** Counts one page view when a public listing is shown. Renders nothing. */
export default function ListingViewTracker({ businessId }: { businessId: string }) {
  const counted = useRef(false);

  useEffect(() => {
    // Strict Mode runs effects twice in development; count the view once.
    if (counted.current) return;
    counted.current = true;
    recordListingEvent(businessId, "view").catch(() => undefined);
  }, [businessId]);

  return null;
}

"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { recordListingEvent } from "@/lib/actions/listing-events";

export type ContactKind = "phone" | "email" | "website" | "directions" | "social";

/** A contact link that counts one click for its listing, then follows the link as usual. */
export default function TrackedLink({
  businessId,
  kind,
  href,
  children,
  ...rest
}: {
  businessId: string;
  kind: ContactKind;
  href: string;
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">) {
  return (
    <a
      {...rest}
      href={href}
      onClick={() => {
        recordListingEvent(businessId, kind).catch(() => undefined);
      }}
    >
      {children}
    </a>
  );
}

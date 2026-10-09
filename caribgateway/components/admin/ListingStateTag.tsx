import { listingState, type Tone } from "@/components/dashboard/ui";

/** The admin's colours for each state. Visitors only ever see Live. */
const TONE: Record<Tone, string> = {
  live: "bg-green-100 text-green-700",
  off: "bg-gray-200 text-gray-700",
  awaiting: "bg-yellow-100 text-yellow-800",
  draft: "bg-sky-100 text-sky-800",
  archived: "bg-gray-100 text-gray-500",
  attention: "bg-red-100 text-red-700",
  neutral: "bg-gray-100 text-gray-700",
};

/** Shows whether a listing is Live, Off, Awaiting approval, a Draft or Archived. */
export default function ListingStateTag({ status, isActive }: { status: string; isActive: boolean }) {
  const state = listingState(status, isActive);
  return (
    <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${TONE[state.tone]}`}>
      {state.label}
    </span>
  );
}

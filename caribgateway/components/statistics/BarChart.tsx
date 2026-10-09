"use client";

import { useState } from "react";
import { CHART } from "./palette";

export type Bar = { label: string; value: number; detail?: string };

/**
 * One series of bars, one color, every value labelled at the bar end. Bars are
 * capped at 24px thick with a 4px rounded end, and each bar shows a tooltip on hover.
 * Keyboard users read the same values from the table beside the chart.
 */
export default function BarChart({
  bars,
  orientation,
  label,
}: {
  bars: Bar[];
  orientation: "horizontal" | "vertical";
  /** Read by screen readers as the name of the list. */
  label: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...bars.map((b) => b.value));

  if (orientation === "horizontal") {
    return (
      <ul aria-label={label} className="space-y-2" onMouseLeave={() => setHover(null)}>
        {bars.map((bar, i) => (
          <li
            key={bar.label}
            className={`relative grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 rounded px-2 py-1 text-sm ${
              hover === i ? "bg-gray-50" : ""
            }`}
            onMouseEnter={() => setHover(i)}
          >
            <span className="truncate text-gray-600">{bar.label}</span>
            <div className="h-3 rounded bg-gray-100">
              <div
                className="h-3 rounded-r-[4px]"
                style={{
                  width: `${(bar.value / max) * 100}%`,
                  background: CHART.series,
                  opacity: hover === null || hover === i ? 1 : 0.55,
                }}
              />
            </div>
            <span className="min-w-[3ch] text-right font-medium tabular-nums text-gray-900">
              {bar.value.toLocaleString("en-US")}
            </span>
            {hover === i && bar.detail && (
              <div className="pointer-events-none absolute right-2 -top-7 z-10 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 shadow-sm">
                {bar.detail}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  const plotHeight = 120;
  return (
    <div role="list" aria-label={label} className="flex items-end justify-between gap-2 px-1" onMouseLeave={() => setHover(null)}>
      {bars.map((bar, i) => {
        const height = Math.round((bar.value / max) * plotHeight);
        return (
          <div
            key={bar.label}
            role="listitem"
            className="relative flex flex-1 flex-col items-center"
            onMouseEnter={() => setHover(i)}
          >
            {hover === i && (
              <div className="pointer-events-none absolute -top-9 z-10 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 shadow-sm">
                <span className="font-semibold text-gray-900 tabular-nums">{bar.value.toLocaleString("en-US")}</span>{" "}
                {bar.detail ?? bar.label}
              </div>
            )}
            <span className="mb-1 text-xs font-medium tabular-nums text-gray-900">
              {bar.value.toLocaleString("en-US")}
            </span>
            <div className="flex h-[120px] items-end">
              <div
                className="w-6 rounded-t-[4px]"
                style={{
                  height: `${height}px`,
                  background: CHART.series,
                  opacity: hover === null || hover === i ? 1 : 0.55,
                }}
              />
            </div>
            <span className="mt-1.5 text-xs text-gray-500">{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}

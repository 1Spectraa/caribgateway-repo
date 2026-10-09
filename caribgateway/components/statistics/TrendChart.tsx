"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { CHART } from "./palette";

export type TrendPoint = { label: string; value: number; previous: number };

const HEIGHT = 240;
const PAD = { left: 44, right: 12, top: 20, bottom: 32 };
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;
/** Room for one date label, so the labels never run into each other. */
const LABEL_SPACE = 72;

/** A round upper limit for the y-axis, and a step that gets there in about four ticks. */
function niceScale(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 4, step: 1 };
  const raw = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((s) => s >= raw) ?? magnitude * 10;
  return { top: Math.ceil(max / step) * step, step };
}

/**
 * Daily values as a line with a light area, with a crosshair and tooltip that
 * list every series at the hovered day. The chart is drawn at its real width, so
 * its text stays the same size on a phone. The table beside it carries the same values.
 */
export default function TrendChart({
  points,
  summary,
  currentLabel,
  previousLabel,
}: {
  points: TrendPoint[];
  /** Read by screen readers in place of the drawing. */
  summary: string;
  currentLabel: string;
  previousLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => setWidth(Math.max(280, Math.round(element.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const n = points.length;
  const plotW = width - PAD.left - PAD.right;
  const { top, step } = niceScale(Math.max(0, ...points.map((p) => Math.max(p.value, p.previous))));
  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD.top + PLOT_H - (v / top) * PLOT_H;
  const baseline = PAD.top + PLOT_H;

  const path = (pick: (p: TrendPoint) => number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(pick(p)).toFixed(1)}`).join(" ");
  const current = path((p) => p.value);
  const previous = path((p) => p.previous);
  const area = n > 0 ? `${current} L${x(n - 1).toFixed(1)} ${baseline} L${x(0).toFixed(1)} ${baseline} Z` : "";
  const peak = points.reduce((best, p, i) => (p.value > points[best].value ? i : best), 0);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const fit = Math.max(2, Math.floor(plotW / LABEL_SPACE));
  const labelEvery = Math.max(1, Math.ceil(n / fit));

  function indexAt(event: PointerEvent<SVGSVGElement>): number {
    const rect = event.currentTarget.getBoundingClientRect();
    const xInView = ((event.clientX - rect.left) / rect.width) * width;
    const ratio = (xInView - PAD.left) / plotW;
    return Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1))));
  }

  if (n === 0) return null;

  const hovered = hover !== null ? points[hover] : null;
  const tooltipLeft = hover !== null ? Math.min(86, Math.max(14, (x(hover) / width) * 100)) : 0;

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 rounded" style={{ background: CHART.series }} aria-hidden="true" />
          {currentLabel}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 rounded" style={{ background: CHART.previous }} aria-hidden="true" />
          {previousLabel}
        </span>
      </div>

      <div ref={containerRef} className="relative">
        <svg
          viewBox={`0 0 ${width} ${HEIGHT}`}
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={summary}
          className="block select-none"
          onPointerMove={(event) => setHover(indexAt(event))}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(t)}
                y2={y(t)}
                style={{ stroke: t === 0 ? CHART.baseline : CHART.gridline }}
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} style={{ fill: CHART.textMuted }}>
                {t.toLocaleString("en-US")}
              </text>
            </g>
          ))}

          <path d={area} style={{ fill: CHART.series }} fillOpacity={0.1} />
          <path
            d={previous}
            fill="none"
            style={{ stroke: CHART.previous }}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={current}
            fill="none"
            style={{ stroke: CHART.series }}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p, i) =>
            i % labelEvery === 0 || i === n - 1 ? (
              <text
                key={`${p.label}-${i}`}
                x={x(i)}
                y={HEIGHT - 8}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                fontSize={11}
                style={{ fill: CHART.textMuted }}
              >
                {p.label}
              </text>
            ) : null,
          )}

          {points[peak].value > 0 && (
            <g>
              <circle
                cx={x(peak)}
                cy={y(points[peak].value)}
                r={4}
                style={{ fill: CHART.series, stroke: CHART.surface }}
                strokeWidth={2}
              />
              <text
                x={x(peak)}
                y={y(points[peak].value) - 10}
                textAnchor="middle"
                fontSize={11}
                style={{ fill: CHART.textSecondary }}
              >
                Peak {points[peak].value.toLocaleString("en-US")}
              </text>
            </g>
          )}

          {hover !== null && (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={baseline}
                style={{ stroke: CHART.baseline }}
                strokeWidth={1}
              />
              <circle
                cx={x(hover)}
                cy={y(points[hover].previous)}
                r={4}
                style={{ fill: CHART.previous, stroke: CHART.surface }}
                strokeWidth={2}
              />
              <circle
                cx={x(hover)}
                cy={y(points[hover].value)}
                r={4}
                style={{ fill: CHART.series, stroke: CHART.surface }}
                strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm"
            style={{ left: `${tooltipLeft}%` }}
          >
            <div className="text-gray-500">{hovered.label}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-0.5 w-4 rounded" style={{ background: CHART.series }} aria-hidden="true" />
              <span className="font-semibold tabular-nums text-gray-900">{hovered.value.toLocaleString("en-US")}</span>
              <span className="text-gray-500">{currentLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-4 rounded" style={{ background: CHART.previous }} aria-hidden="true" />
              <span className="font-semibold tabular-nums text-gray-900">{hovered.previous.toLocaleString("en-US")}</span>
              <span className="text-gray-500">{previousLabel}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

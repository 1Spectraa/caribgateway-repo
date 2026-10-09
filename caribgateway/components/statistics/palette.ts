/**
 * Chart colours. Each one is a CSS variable set in app/globals.css: the operator dashboard and
 * the public site use the reference palette, and the admin console re-maps them. One series
 * colour for every mark. Text uses neutral ink, never the series colour.
 */
export const CHART = {
  series: "var(--chart-series)",
  previous: "var(--chart-previous)",
  gridline: "var(--chart-gridline)",
  baseline: "var(--chart-baseline)",
  surface: "var(--chart-surface)",
  textSecondary: "var(--chart-text-secondary)",
  textMuted: "var(--chart-text-muted)",
} as const;

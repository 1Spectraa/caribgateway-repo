import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/dashboard/icons";

/** Joins class names, skipping anything falsy. */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------------ */
/* Surfaces, buttons, and form controls                                      */
/* ------------------------------------------------------------------------ */

export const cardClass = "rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-sm";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal";

export function buttonClass(
  variant: "primary" | "secondary" | "ghost" | "danger" = "primary",
  extra?: string,
): string {
  // Size and weight live with each variant, so no two utilities for the same property meet in the CSS.
  const base = `inline-flex items-center justify-center gap-2 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`;
  const variants = {
    primary: "bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-teal-dark",
    secondary:
      "bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
    ghost: "px-3 py-2 text-sm font-medium text-brand-navy hover:bg-slate-100",
    danger: "px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50",
  } as const;
  return cx(base, variants[variant], extra);
}

export const inputClass =
  "block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-teal focus:outline-none focus:ring-4 focus:ring-brand-teal/15 disabled:bg-slate-50";

export const labelClass = "mb-1.5 block text-sm font-medium text-slate-800";

export const hintClass = "mt-1.5 text-xs leading-5 text-slate-500";

/* ------------------------------------------------------------------------ */
/* Listing status                                                            */
/* ------------------------------------------------------------------------ */

export type Tone = "live" | "off" | "awaiting" | "draft" | "archived" | "attention" | "neutral";

const PILL: Record<Tone, string> = {
  live: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  off: "bg-slate-100 text-slate-600 ring-slate-500/20",
  awaiting: "bg-amber-50 text-amber-800 ring-amber-600/25",
  draft: "bg-sky-50 text-sky-800 ring-sky-600/20",
  archived: "bg-slate-100 text-slate-500 ring-slate-400/20",
  attention: "bg-rose-50 text-rose-700 ring-rose-600/20",
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

const DOT: Record<Tone, string> = {
  live: "bg-emerald-500",
  off: "bg-slate-400",
  awaiting: "bg-amber-500",
  draft: "bg-sky-500",
  archived: "bg-slate-400",
  attention: "bg-rose-500",
  neutral: "bg-slate-400",
};

/** The label and colour for a listing's state. Visitors can only see "Live". */
export function listingState(status: string, isActive: boolean): { tone: Tone; label: string } {
  if (status === "published") {
    return isActive ? { tone: "live", label: "Live" } : { tone: "off", label: "Off" };
  }
  if (status === "pending") return { tone: "awaiting", label: "Awaiting approval" };
  if (status === "draft") return { tone: "draft", label: "Draft" };
  return { tone: "archived", label: "Archived" };
}

export function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        PILL[tone],
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", DOT[tone])} aria-hidden="true" />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------------ */
/* Layout pieces                                                             */
/* ------------------------------------------------------------------------ */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-brand-teal">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-brand-navy sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const NOTICE = {
  info: "bg-sky-50 text-sky-900 ring-sky-200",
  success: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  warning: "bg-amber-50 text-amber-900 ring-amber-200",
  error: "bg-rose-50 text-rose-900 ring-rose-200",
} as const;

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: keyof typeof NOTICE;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx("rounded-2xl px-4 py-3 text-sm leading-6 ring-1 ring-inset", NOTICE[tone])}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-0.5" : undefined}>{children}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10 text-brand-teal">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-brand-navy">{title}</h2>
      {children && <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-600">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const ACCENT = {
  teal: "bg-brand-teal/10 text-brand-teal",
  coral: "bg-brand-coral/15 text-brand-coral",
  navy: "bg-brand-navy/10 text-brand-navy",
  amber: "bg-amber-100 text-amber-700",
} as const;

export function StatTile({
  label,
  value,
  hint,
  icon,
  accent = "teal",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
  accent?: keyof typeof ACCENT;
}) {
  return (
    <div className={cx(cardClass, "p-5")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {icon && (
          <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", ACCENT[accent])}>
            <Icon name={icon} className="h-5 w-5" />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
  );
}

/** A thin progress bar. The value is a percentage from 0 to 100. */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
    >
      <div className="h-2 rounded-full bg-brand-teal transition-all" style={{ width: `${clamped}%` }} />
    </div>
  );
}

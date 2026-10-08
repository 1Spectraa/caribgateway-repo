"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { saveSiteContent, type SiteContentState } from "@/lib/actions/site-content";
import {
  formatLines,
  formatLinks,
  formatStats,
  type PageCopy,
  type SiteContent,
} from "@/lib/site-content";

const inputClass =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  multiline = false,
  rows = 3,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
        {hint && <span className="text-gray-400 font-normal"> {hint}</span>}
      </label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          defaultValue={defaultValue}
          className={inputClass}
        />
      ) : (
        <input id={name} name={name} type="text" defaultValue={defaultValue} className={inputClass} />
      )}
    </div>
  );
}

function PageHeaderFields({ title, prefix, copy }: { title: string; prefix: string; copy: PageCopy }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Eyebrow" name={`${prefix}_eyebrow`} defaultValue={copy.eyebrow} />
        <Field label="Title" name={`${prefix}_title`} defaultValue={copy.title} />
      </div>
      <Field label="Intro" name={`${prefix}_subtitle`} defaultValue={copy.subtitle} multiline rows={2} />
    </div>
  );
}

export default function SiteContentForm({ content }: { content: SiteContent }) {
  const [state, formAction, pending] = useActionState<SiteContentState, FormData>(
    saveSiteContent,
    null,
  );

  return (
    <form action={formAction} className="space-y-6 max-w-4xl">
      {state && "error" in state && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {state.error}
        </div>
      )}
      {state && "ok" in state && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
          Saved. The public site will show the new copy on the next page load.
        </div>
      )}

      <Section
        title="Navigation"
        hint="Main menu links, one per line as: Label | /path"
      >
        <Field
          label="Menu links"
          name="navigation"
          defaultValue={formatLinks(content.navigation)}
          multiline
          rows={5}
        />
      </Section>

      <Section
        title="Footer"
        hint="Link lists take one line per link as: Label | /path. Social profiles are: Platform | https://…"
      >
        <Field
          label="Tagline"
          name="footer_tagline"
          defaultValue={content.footer.tagline}
          multiline
          rows={3}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Destinations column"
            name="footer_destinations"
            defaultValue={formatLinks(content.footer.destinations)}
            multiline
            rows={6}
          />
          <Field
            label="Experiences column"
            name="footer_experiences"
            defaultValue={formatLinks(content.footer.experiences)}
            multiline
            rows={6}
          />
          <Field
            label="Company column"
            name="footer_company"
            defaultValue={formatLinks(content.footer.company)}
            multiline
            rows={4}
          />
          <Field
            label="Social profiles"
            name="footer_social"
            defaultValue={formatLinks(content.footer.social)}
            multiline
            rows={4}
            hint="(X, Instagram, Facebook)"
          />
        </div>
        <Field
          label="Legal links"
          name="footer_legal"
          defaultValue={formatLinks(content.footer.legal)}
          multiline
          rows={3}
        />
        <Field label="Copyright line" name="footer_copyright" defaultValue={content.footer.copyright} />
      </Section>

      <Section title="Homepage: hero" hint="The banner at the top of the homepage.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Badge text" name="hero_badge" defaultValue={content.home_hero.badge} />
          <Field label="Headline" name="hero_headline" defaultValue={content.home_hero.headline} />
          <Field
            label="Highlighted word"
            name="hero_headline_highlight"
            defaultValue={content.home_hero.headline_highlight}
          />
        </div>
        <Field
          label="Subheadline"
          name="hero_subheadline"
          defaultValue={content.home_hero.subheadline}
          multiline
          rows={2}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Primary button label"
            name="hero_primary_label"
            defaultValue={content.home_hero.primary_label}
          />
          <Field
            label="Primary button link"
            name="hero_primary_href"
            defaultValue={content.home_hero.primary_href}
          />
          <Field
            label="Secondary button label"
            name="hero_secondary_label"
            defaultValue={content.home_hero.secondary_label}
          />
          <Field
            label="Secondary button link"
            name="hero_secondary_href"
            defaultValue={content.home_hero.secondary_href}
          />
        </div>
      </Section>

      <Section title="Homepage: stats" hint="Figures shown under the hero, one per line as: Value | Label">
        <Field
          label="Stats"
          name="home_stats"
          defaultValue={formatStats(content.home_stats)}
          multiline
          rows={3}
        />
      </Section>

      <Section
        title="Homepage: featured destinations"
        hint="Cards come from destinations marked Featured. Each card's tagline, emoji, and tags are set on the destination."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Eyebrow" name="destinations_eyebrow" defaultValue={content.home_destinations.eyebrow} />
          <Field label="Heading" name="destinations_title" defaultValue={content.home_destinations.title} />
          <Field label="Button label" name="destinations_cta_label" defaultValue={content.home_destinations.cta_label} />
        </div>
        <Field label="Intro" name="destinations_subtitle" defaultValue={content.home_destinations.subtitle} multiline rows={2} />
      </Section>

      <Section
        title="Homepage: caribbean experiences"
        hint="Cards come from categories marked 'Show on homepage'. Add or reorder them on the Categories page."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Eyebrow" name="experiences_eyebrow" defaultValue={content.home_experiences.eyebrow} />
          <Field label="Heading" name="experiences_title" defaultValue={content.home_experiences.title} />
          <Field label="Button label" name="experiences_cta_label" defaultValue={content.home_experiences.cta_label} />
        </div>
        <Field label="Intro" name="experiences_subtitle" defaultValue={content.home_experiences.subtitle} multiline rows={2} />
      </Section>

      <Section title="Homepage: call to action" hint="The banner near the bottom of the homepage.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Eyebrow" name="cta_eyebrow" defaultValue={content.home_cta.eyebrow} />
          <Field label="Heading" name="cta_title" defaultValue={content.home_cta.title} />
          <Field label="Highlighted line" name="cta_title_highlight" defaultValue={content.home_cta.title_highlight} />
        </div>
        <Field label="Intro" name="cta_subtitle" defaultValue={content.home_cta.subtitle} multiline rows={3} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Primary button label" name="cta_primary_label" defaultValue={content.home_cta.primary_label} />
          <Field label="Primary button link" name="cta_primary_href" defaultValue={content.home_cta.primary_href} />
          <Field label="Secondary button label" name="cta_secondary_label" defaultValue={content.home_cta.secondary_label} />
          <Field label="Secondary button link" name="cta_secondary_href" defaultValue={content.home_cta.secondary_href} />
        </div>
        <Field
          label="Trust points"
          name="cta_trust_points"
          defaultValue={formatLines(content.home_cta.trust_points)}
          multiline
          rows={3}
          hint="(one per line)"
        />
      </Section>

      <Section title="Page headers" hint="The banner at the top of each listing page.">
        <PageHeaderFields title="Destinations page" prefix="destinations_page" copy={content.page_destinations} />
        <PageHeaderFields title="Experiences page" prefix="experiences_page" copy={content.page_experiences} />
        <PageHeaderFields title="Accommodations page" prefix="accommodations_page" copy={content.page_accommodations} />
      </Section>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-6 py-2.5 rounded disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save site content"}
        </button>
      </div>
    </form>
  );
}

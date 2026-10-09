/**
 * Editable site copy: navigation, footer, homepage, and page headers.
 *
 * The admin "Site Content" page writes this shape to the site_settings row
 * 'site_content'. Public pages read it through getSiteContent() in
 * lib/queries.ts. Anything missing from the database falls back to
 * DEFAULT_SITE_CONTENT, so the site still renders before an admin edits it.
 *
 * Client-safe: no server-only imports in this file.
 */

export type LinkItem = { label: string; href: string };
export type StatItem = { value: string; label: string };
export type PageCopy = { eyebrow: string; title: string; subtitle: string };

export type SiteContent = {
  navigation: LinkItem[];
  footer: {
    tagline: string;
    destinations: LinkItem[];
    experiences: LinkItem[];
    company: LinkItem[];
    /** Social profiles. The label is the platform name (X, Instagram, Facebook). */
    social: LinkItem[];
    legal: LinkItem[];
    copyright: string;
  };
  home_hero: {
    badge: string;
    headline: string;
    headline_highlight: string;
    subheadline: string;
    primary_label: string;
    primary_href: string;
    secondary_label: string;
    secondary_href: string;
  };
  home_stats: StatItem[];
  home_destinations: { eyebrow: string; title: string; subtitle: string; cta_label: string };
  home_experiences: { eyebrow: string; title: string; subtitle: string; cta_label: string };
  home_cta: {
    eyebrow: string;
    title: string;
    title_highlight: string;
    subtitle: string;
    primary_label: string;
    primary_href: string;
    secondary_label: string;
    secondary_href: string;
    trust_points: string[];
  };
  page_destinations: PageCopy;
  page_experiences: PageCopy;
  page_accommodations: PageCopy;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  navigation: [
    { label: "Destinations", href: "/destinations" },
    { label: "Experiences", href: "/businesses" },
    { label: "Accommodations", href: "/accommodations" },
    { label: "Blog", href: "/blog" },
  ],
  footer: {
    tagline:
      "Your ultimate guide to the Caribbean. Discover breathtaking destinations, rich cultures, and unforgettable experiences across the islands.",
    // Country pages exist for every country, so these links never lead to a 404.
    destinations: [
      { label: "Barbados", href: "/countries/barbados" },
      { label: "Jamaica", href: "/countries/jamaica" },
      { label: "Trinidad & Tobago", href: "/countries/trinidad-and-tobago" },
      { label: "St. Lucia", href: "/countries/saint-lucia" },
      { label: "Antigua & Barbuda", href: "/countries/antigua-and-barbuda" },
      { label: "St. Kitts & Nevis", href: "/countries/saint-kitts-and-nevis" },
    ],
    experiences: [
      { label: "Beach Escapes", href: "/businesses?category=beaches-nature" },
      { label: "Adventure Sports", href: "/businesses?category=adventure-activities" },
      { label: "Cultural Tours", href: "/businesses?category=cultural-heritage-tours" },
      { label: "Water Sports", href: "/businesses?category=water-sports-diving" },
      { label: "Luxury Stays", href: "/accommodations?type=all-inclusive-resorts" },
    ],
    company: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
    social: [
      { label: "X (Twitter)", href: "https://x.com/CaribGateway" },
      {
        label: "Instagram",
        href: "https://www.instagram.com/caribgateway/?utm_source=ig_web_button_share_sheet",
      },
      { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61590630655752" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
    copyright: "© 2026 CaribGateway. All rights reserved.",
  },
  home_hero: {
    badge: "Discover the Caribbean's Best",
    headline: "Discover the Beauty of the",
    headline_highlight: "Caribbean",
    subheadline:
      "Explore pristine beaches, vibrant cultures, and unforgettable adventures across the most stunning islands in the world.",
    primary_label: "Explore Destinations",
    primary_href: "/destinations",
    secondary_label: "View Experiences",
    secondary_href: "/businesses",
  },
  home_stats: [
    { value: "30+", label: "Islands" },
    { value: "500+", label: "Destinations" },
    { value: "50K+", label: "Happy Travelers" },
  ],
  home_destinations: {
    eyebrow: "Explore",
    title: "Featured Destinations",
    subtitle:
      "From world-class beaches to vibrant cultural capitals — discover what makes each Caribbean island unique.",
    cta_label: "View All Destinations",
  },
  home_experiences: {
    eyebrow: "Browse By",
    title: "Caribbean Experiences",
    subtitle:
      "Whatever you're looking for, the Caribbean has it. Find your perfect experience below.",
    cta_label: "View All Experiences",
  },
  home_cta: {
    eyebrow: "Start Your Journey",
    title: "Ready to Discover Your",
    title_highlight: "Caribbean Paradise?",
    subtitle:
      "Start planning your dream trip today. Explore curated destinations, handpicked experiences, and expert travel guides — all in one place.",
    primary_label: "Explore Destinations",
    primary_href: "/destinations",
    secondary_label: "View All Businesses",
    secondary_href: "/businesses",
    trust_points: ["No booking fees", "Curated by locals", "Trusted by 50,000+ travelers"],
  },
  page_destinations: {
    eyebrow: "Explore the Region",
    title: "Discover the Caribbean",
    subtitle:
      "From volcanic peaks and lush rainforests to turquoise lagoons and colonial towns — every Caribbean destination tells its own story.",
  },
  page_experiences: {
    eyebrow: "Explore & Discover",
    title: "Caribbean Experiences",
    subtitle:
      "Restaurants, attractions, tours, and transportation — hand-picked across the Caribbean's most beautiful destinations.",
  },
  page_accommodations: {
    eyebrow: "Where to Stay",
    title: "Caribbean Accommodations",
    subtitle:
      "Hotels, Airbnb-style rentals, villas, and guesthouses — hand-picked across the islands. Filter by country or type of stay.",
  },
};

/** Fills any section missing from the stored JSON with its default. */
export function mergeSiteContent(stored: unknown): SiteContent {
  if (!stored || typeof stored !== "object") return DEFAULT_SITE_CONTENT;
  const saved = stored as Partial<SiteContent>;
  const d = DEFAULT_SITE_CONTENT;
  return {
    navigation: Array.isArray(saved.navigation) ? saved.navigation : d.navigation,
    footer: { ...d.footer, ...saved.footer },
    home_hero: { ...d.home_hero, ...saved.home_hero },
    home_stats: Array.isArray(saved.home_stats) ? saved.home_stats : d.home_stats,
    home_destinations: { ...d.home_destinations, ...saved.home_destinations },
    home_experiences: { ...d.home_experiences, ...saved.home_experiences },
    home_cta: { ...d.home_cta, ...saved.home_cta },
    page_destinations: { ...d.page_destinations, ...saved.page_destinations },
    page_experiences: { ...d.page_experiences, ...saved.page_experiences },
    page_accommodations: { ...d.page_accommodations, ...saved.page_accommodations },
  };
}

// ---------------------------------------------------------------------------
// Line-based editing format used by the admin form.
//   Links:  "Label | /path"       one per line
//   Stats:  "Value | Label"       one per line
//   Lists:  one item per line
// ---------------------------------------------------------------------------

/** Only in-site paths, anchors, and web/mail/phone links are allowed. */
export function safeHref(href: string): string {
  return /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(href) ? href : "#";
}

function parsePairs(text: string): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const sep = line.indexOf("|");
    if (sep === -1) continue;
    const left = line.slice(0, sep).trim();
    const right = line.slice(sep + 1).trim();
    if (left && right) pairs.push([left, right]);
  }
  return pairs;
}

export function parseLinks(text: string): LinkItem[] {
  return parsePairs(text).map(([label, href]) => ({ label, href: safeHref(href) }));
}

export function parseStats(text: string): StatItem[] {
  return parsePairs(text).map(([value, label]) => ({ value, label }));
}

export function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function formatLinks(items: LinkItem[]): string {
  return items.map((item) => `${item.label} | ${item.href}`).join("\n");
}

export function formatStats(items: StatItem[]): string {
  return items.map((item) => `${item.value} | ${item.label}`).join("\n");
}

export function formatLines(items: string[]): string {
  return items.join("\n");
}

// ---------------------------------------------------------------------------
// Links to destination and country pages. A link is only valid if its record
// exists and is active; otherwise the page it leads to is a 404.
// ---------------------------------------------------------------------------

export type RecordKind = "destinations" | "countries";

export type RecordLink = {
  /** Where the link appears, e.g. "Footer: destinations". */
  where: string;
  label: string;
  href: string;
  kind: RecordKind;
  slug: string;
};

/** Slugs of the active destinations and countries that links can point at. */
export type KnownRecords = Record<RecordKind, Set<string>>;

/** Matches /destinations/<slug> and /countries/<slug>, with an optional trailing slash, query, or hash. */
const RECORD_PATH = /^\/(destinations|countries)\/([^/?#]+)\/?(?:[?#].*)?$/;

function decodeSlug(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Every link in the content that points at a destination or country page. */
export function listRecordLinks(content: SiteContent): RecordLink[] {
  const sections: Array<[string, LinkItem[]]> = [
    ["Menu", content.navigation],
    ["Footer: destinations", content.footer.destinations],
    ["Footer: experiences", content.footer.experiences],
    ["Footer: company", content.footer.company],
    ["Footer: legal", content.footer.legal],
    [
      "Homepage: hero buttons",
      [
        { label: content.home_hero.primary_label, href: content.home_hero.primary_href },
        { label: content.home_hero.secondary_label, href: content.home_hero.secondary_href },
      ],
    ],
    [
      "Homepage: call to action buttons",
      [
        { label: content.home_cta.primary_label, href: content.home_cta.primary_href },
        { label: content.home_cta.secondary_label, href: content.home_cta.secondary_href },
      ],
    ],
  ];

  const links: RecordLink[] = [];
  for (const [where, items] of sections) {
    for (const item of items) {
      const match = RECORD_PATH.exec(item.href);
      if (!match) continue;
      links.push({
        where,
        label: item.label,
        href: item.href,
        kind: match[1] as RecordKind,
        slug: decodeSlug(match[2]),
      });
    }
  }
  return links;
}

/** Record links whose destination or country is missing or inactive. */
export function brokenRecordLinks(content: SiteContent, known: KnownRecords): RecordLink[] {
  return listRecordLinks(content).filter((link) => !known[link.kind].has(link.slug));
}

/** One entry per broken link, for the error shown when saving. */
export function describeRecordLinks(links: RecordLink[]): string {
  return links.map((link) => `${link.where}: "${link.label}" → ${link.href}`).join("; ");
}

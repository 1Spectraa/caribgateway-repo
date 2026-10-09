export type LegalSection = { heading: string; body: string[] };

/** A plain policy page: the public site's header band, then the sections at reading width. */
export default function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  /** The date the text last changed, shown at the top. */
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <section className="relative bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-teal-dark pt-32 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-brand-coral font-semibold text-sm uppercase tracking-widest mb-3">{eyebrow}</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">{title}</h1>
          <p className="text-lg text-white/80 max-w-3xl leading-relaxed">{intro}</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <article className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="mb-10 text-sm text-gray-500">Last updated {updated}</p>
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="mb-3 text-xl font-semibold text-brand-navy">{section.heading}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mb-3 leading-7 text-gray-700 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

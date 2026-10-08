import { getRecordSlugs, getSiteContent } from "@/lib/queries";
import { brokenRecordLinks } from "@/lib/site-content";
import SiteContentForm from "@/components/admin/SiteContentForm";

export default async function SiteContentAdminPage() {
  const content = await getSiteContent();
  const known = await getRecordSlugs().catch(() => null);
  const broken = known ? brokenRecordLinks(content, known) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Site Content</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Navigation, footer, homepage copy, and page headers. Destination and experience cards are
          managed from the Destinations and Categories pages.
        </p>
      </div>

      {broken.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-sm space-y-2">
          <p className="font-semibold">
            These links lead to a destination or country that doesn&apos;t exist or isn&apos;t active:
          </p>
          <ul className="list-disc pl-5 space-y-0.5">
            {broken.map((link) => (
              <li key={`${link.where}-${link.label}-${link.href}`}>
                {link.where}: &ldquo;{link.label}&rdquo; → <span className="font-mono">{link.href}</span>
              </li>
            ))}
          </ul>
          <p>Fix them in the form below. Saving is blocked until they are fixed.</p>
        </div>
      )}

      <SiteContentForm content={content} />
    </div>
  );
}

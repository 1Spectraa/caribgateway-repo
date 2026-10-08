import { getSiteContent } from "@/lib/queries";
import SiteContentForm from "@/components/admin/SiteContentForm";

export default async function SiteContentAdminPage() {
  const content = await getSiteContent();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Site Content</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Navigation, footer, homepage copy, and page headers. Destination and experience cards are
          managed from the Destinations and Categories pages.
        </p>
      </div>
      <SiteContentForm content={content} />
    </div>
  );
}

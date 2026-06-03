import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createPublicServerClient } from "@/lib/supabase";
import BusinessCard from "@/components/businesses/BusinessCard";
import type { SocialLinks } from "@/lib/database.types";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicServerClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, short_description")
    .eq("slug", slug)
    .single();

  if (!business) {
    return { title: "Business Not Found — CaribGateway" };
  }

  return {
    title: `${business.name} — CaribGateway`,
    description:
      business.short_description ??
      `Discover ${business.name} on CaribGateway — your guide to the best Caribbean experiences.`,
  };
}

const typeConfig: Record<string, { label: string; colorClass: string; gradientClass: string }> = {
  hotel:          { label: "Hotel",           colorClass: "bg-blue-100 text-blue-700",     gradientClass: "from-blue-400 to-blue-600" },
  restaurant:     { label: "Restaurant",      colorClass: "bg-orange-100 text-orange-700", gradientClass: "from-orange-400 to-orange-600" },
  attraction:     { label: "Attraction",      colorClass: "bg-purple-100 text-purple-700", gradientClass: "from-purple-400 to-purple-600" },
  tour_operator:  { label: "Tour Operator",   colorClass: "bg-green-100 text-green-700",   gradientClass: "from-green-400 to-green-600" },
  transportation: { label: "Transportation",  colorClass: "bg-slate-100 text-slate-700",   gradientClass: "from-slate-400 to-slate-600" },
};

const priceSymbols: Record<string, string> = {
  budget:   "$",
  moderate: "$$",
  upscale:  "$$$",
  luxury:   "$$$$",
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${
            i < full
              ? "text-amber-400"
              : i === full && half
              ? "text-amber-300"
              : "text-gray-200"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default async function BusinessDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createPublicServerClient();

  // Fetch business
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!business) {
    notFound();
  }

  // Parallel fetches
  const [
    { data: images },
    { data: destination },
    { data: relatedBusinesses },
  ] = await Promise.all([
    supabase
      .from("business_images")
      .select("*")
      .eq("business_id", business.id)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true }),
    supabase
      .from("destinations")
      .select("id, name, slug")
      .eq("id", business.destination_id)
      .single(),
    supabase
      .from("businesses")
      .select("*")
      .eq("destination_id", business.destination_id)
      .eq("business_type", business.business_type)
      .eq("status", "published")
      .eq("is_active", true)
      .neq("id", business.id)
      .limit(3),
  ]);

  const imageList = images ?? [];
  const primaryImage = imageList.find((img) => img.is_primary) ?? imageList[0];

  // Fetch primary images for related businesses
  let relatedImageMap: Record<string, string> = {};
  const relatedList = relatedBusinesses ?? [];
  if (relatedList.length > 0) {
    const { data: relatedImages } = await supabase
      .from("business_images")
      .select("id, business_id, url, is_primary")
      .in("business_id", relatedList.map((b) => b.id))
      .eq("is_primary", true);

    relatedImageMap = Object.fromEntries(
      (relatedImages ?? []).map((img) => [img.business_id, img.url])
    );
  }

  const config = typeConfig[business.business_type] ?? typeConfig.attraction;
  const socialLinks = business.social_links as SocialLinks;

  return (
    <>
      {/* Hero image */}
      <div className="relative h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt_text ?? business.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradientClass}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-10 max-w-7xl mx-auto">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1">
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${config.colorClass}`}>
                {config.label}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-md">
                {business.name}
              </h1>
              {destination && (
                <p className="text-white/80 mt-2 text-base font-medium">
                  {destination.name}
                </p>
              )}
            </div>
            {business.is_verified && (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-3 py-2 rounded-full border border-white/20">
                <svg className="w-4 h-4 text-brand-teal" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {imageList.length > 1 && (
        <div className="bg-black/90 overflow-x-auto">
          <div className="flex gap-1 px-4 py-2 max-w-7xl mx-auto">
            {imageList.slice(0, 8).map((img) => (
              <div key={img.id} className="relative shrink-0 w-20 h-14 overflow-hidden rounded">
                <img
                  src={img.url}
                  alt={img.alt_text ?? business.name}
                  className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-teal transition-colors">Home</Link>
            <ChevronRight />
            <Link href="/businesses" className="hover:text-brand-teal transition-colors">Businesses</Link>
            {destination && (
              <>
                <ChevronRight />
                <Link
                  href={`/destinations/${destination.slug}`}
                  className="hover:text-brand-teal transition-colors"
                >
                  {destination.name}
                </Link>
              </>
            )}
            <ChevronRight />
            <span className="text-brand-navy font-medium truncate max-w-[200px]">{business.name}</span>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top meta row */}
          <div className="flex items-center gap-4 flex-wrap mb-6">
            {business.avg_rating && business.avg_rating > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={business.avg_rating} />
                <span className="text-sm font-semibold text-gray-700">{business.avg_rating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({business.review_count} reviews)</span>
              </div>
            )}
            {business.price_range && (
              <span className="text-brand-coral font-bold text-lg">
                {priceSymbols[business.price_range] ?? business.price_range}
              </span>
            )}
          </div>

          {/* Short description */}
          {business.short_description && (
            <p className="text-xl text-gray-700 leading-relaxed font-medium mb-10 max-w-3xl">
              {business.short_description}
            </p>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: main content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Full description */}
              {business.description && (
                <section>
                  <h2 className="text-xl font-bold text-brand-navy mb-4">About</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {business.description}
                    </p>
                  </div>
                </section>
              )}

              {/* Amenities */}
              {business.amenities && business.amenities.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-brand-navy mb-4">Amenities</h2>
                  <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {business.amenities.map((amenity) => (
                      <li key={amenity} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-brand-teal shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {amenity}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Features */}
              {business.features && business.features.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-brand-navy mb-4">Features</h2>
                  <div className="flex flex-wrap gap-2">
                    {business.features.map((feature) => (
                      <span
                        key={feature}
                        className="bg-brand-navy/8 text-brand-navy text-sm font-medium px-3 py-1 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right: sidebar */}
            <div className="space-y-6">
              {/* Contact card */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-brand-navy mb-4">Contact</h2>
                <div className="space-y-3">
                  {business.phone && (
                    <a
                      href={`tel:${business.phone}`}
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-brand-teal transition-colors"
                    >
                      <svg className="w-4 h-4 text-brand-slate shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {business.phone}
                    </a>
                  )}
                  {business.email && (
                    <a
                      href={`mailto:${business.email}`}
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-brand-teal transition-colors"
                    >
                      <svg className="w-4 h-4 text-brand-slate shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {business.email}
                    </a>
                  )}
                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-brand-teal transition-colors"
                    >
                      <svg className="w-4 h-4 text-brand-slate shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Visit website
                    </a>
                  )}

                  {/* Social links */}
                  {socialLinks && Object.keys(socialLinks).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      {socialLinks.facebook && (
                        <SocialLink href={socialLinks.facebook} label="Facebook" />
                      )}
                      {socialLinks.instagram && (
                        <SocialLink href={socialLinks.instagram} label="Instagram" />
                      )}
                      {socialLinks.twitter && (
                        <SocialLink href={socialLinks.twitter} label="Twitter" />
                      )}
                      {socialLinks.tripadvisor && (
                        <SocialLink href={socialLinks.tripadvisor} label="TripAdvisor" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Location card */}
              {(business.address_line1 || business.city) && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-lg font-bold text-brand-navy mb-4">Location</h2>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-brand-slate shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      {business.address_line1 && (
                        <p>{business.address_line1}</p>
                      )}
                      {business.city && (
                        <p>{business.city}</p>
                      )}
                      {destination && (
                        <Link
                          href={`/destinations/${destination.slug}`}
                          className="text-brand-teal hover:text-brand-teal-dark transition-colors font-medium mt-1 block"
                        >
                          {destination.name} →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related businesses */}
      {relatedList.length > 0 && (
        <section className="py-14 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-brand-navy mb-8">
              More {config.label}s{destination ? ` in ${destination.name}` : ""}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedList.map((related) => (
                <BusinessCard
                  key={related.id}
                  business={{
                    ...related,
                    destination_name: destination?.name,
                    primaryImageUrl: relatedImageMap[related.id],
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function ChevronRight() {
  return (
    <svg
      className="w-4 h-4 text-gray-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-gray-500 hover:text-brand-teal bg-gray-100 hover:bg-brand-teal/10 px-3 py-1.5 rounded-full transition-colors font-medium"
    >
      {label}
    </a>
  );
}

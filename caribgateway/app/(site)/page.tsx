import HeroSection from "@/components/sections/HeroSection";
import FeaturedDestinations from "@/components/sections/FeaturedDestinations";
import FeaturedCategories from "@/components/sections/FeaturedCategories";
import CTASection from "@/components/sections/CTASection";
import { getHomepageData, getSiteContent } from "@/lib/queries";

export default async function Home() {
  const [content, home] = await Promise.all([getSiteContent(), getHomepageData()]);

  return (
    <>
      <HeroSection hero={content.home_hero} stats={content.home_stats} />
      <FeaturedDestinations copy={content.home_destinations} destinations={home.destinations} />
      <FeaturedCategories copy={content.home_experiences} experiences={home.experiences} />
      <CTASection copy={content.home_cta} />
    </>
  );
}

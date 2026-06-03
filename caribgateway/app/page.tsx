import HeroSection from "@/components/sections/HeroSection";
import FeaturedDestinations from "@/components/sections/FeaturedDestinations";
import FeaturedCategories from "@/components/sections/FeaturedCategories";
import CTASection from "@/components/sections/CTASection";

export default function Home() {
  return(
    <>
      <HeroSection />
      <FeaturedDestinations />
      <FeaturedCategories />
      <CTASection />
    </>
  );
}

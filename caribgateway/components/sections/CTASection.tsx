import Link from "next/link";
import { ctaTrustPoints } from "@/data/content";

export default function CTASection() {
  return (
    <section id="cta" className="relative py-28 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #1f8a8a 0%, #1f6080 50%, #1f476c 100%)",
        }}
      />

      {/* Top wave — transitions from gray-50 categories section */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ fill: "#f9fafb", display: "block" }}
        >
          <path d="M0,0 L1440,0 L1440,40 C1200,80 960,0 720,40 C480,80 240,0 0,40 Z" />
        </svg>
      </div>

      {/* Decorative orbs */}
      <div className="absolute top-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#f37e5b]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-block bg-brand-coral/20 text-brand-coral text-sm font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 border border-brand-coral/30">
          Start Your Journey
        </span>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Ready to Discover Your
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #f37e5b, #ffaa88)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Caribbean Paradise?
          </span>
        </h2>

        <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
          Start planning your dream trip today. Explore curated destinations,
          handpicked experiences, and expert travel guides — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/destinations"
            className="bg-brand-coral hover:bg-brand-coral-dark text-white font-semibold px-8 py-4 rounded-full transition-all hover:scale-105 w-full sm:w-auto"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
          >
            Explore Destinations
          </Link>
          <Link
            href="/businesses"
            className="bg-white text-brand-navy hover:bg-gray-100 font-semibold px-8 py-4 rounded-full transition-all hover:scale-105 w-full sm:w-auto"
          >
            View All Businesses
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          {ctaTrustPoints.map((point) => (
            <div key={point} className="flex items-center gap-2 text-white/60">
              <svg
                className="w-5 h-5 text-brand-coral flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">{point}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

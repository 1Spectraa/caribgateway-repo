import Link from "next/link";
import { stats } from "@/data/content";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #1f476c 0%, #1a7070 45%, #1f8a8a 100%)",
        }}
      />

      {/* Decorative bokeh orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/6 w-80 h-80 bg-[#f37e5b]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 right-1/3 w-64 h-64 bg-[#1f8a8a]/30 rounded-full blur-2xl pointer-events-none" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Bottom wave — transitions into the next section */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ fill: "#ffffff", display: "block" }}
        >
          <path d="M0,50 C200,100 400,0 600,50 C800,100 1000,10 1200,50 C1320,75 1390,35 1440,50 L1440,100 L0,100 Z" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm px-4 py-1.5 rounded-full mb-8 border border-white/20">
          <span className="w-2 h-2 bg-brand-coral rounded-full animate-pulse" />
          Discover the Caribbean&apos;s Best
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 max-w-5xl mx-auto">
          Discover the Beauty{" "}
          <br className="hidden sm:block" />
          of the{" "}
          <span
            className="relative inline-block"
            style={{
              background: "linear-gradient(135deg, #f37e5b, #ffaa88)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Caribbean
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          Explore pristine beaches, vibrant cultures, and unforgettable
          adventures across the most stunning islands in the world.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/destinations"
            className="bg-brand-coral hover:bg-brand-coral-dark text-white font-semibold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg w-full sm:w-auto"
            style={{ boxShadow: "0 8px 32px rgba(243,126,91,0.35)" }}
          >
            Explore Destinations
          </Link>
          <Link
            href="/businesses"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-full border border-white/30 transition-all hover:scale-105 backdrop-blur-sm w-full sm:w-auto"
          >
            View Experiences
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-white/60 text-sm mt-0.5">{stat.label}</div>
              </div>
              {i < stats.length - 1 && (
                <div className="hidden sm:block w-px h-10 bg-white/20" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { categories } from "@/data/content";

export default function FeaturedCategories() {
  return (
    <section id="categories" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-brand-coral font-semibold text-sm uppercase tracking-widest">
            Browse By
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-brand-navy mt-2 mb-4">
            Caribbean Experiences
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
            Whatever you&apos;re looking for, the Caribbean has it. Find your
            perfect experience below.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href="#"
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-100 hover:border-brand-teal/25 transition-all duration-200 hover:-translate-y-0.5 flex items-start gap-5"
            >
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ backgroundColor: cat.accentColor }}
              >
                <span className="text-2xl">{cat.icon}</span>
              </div>

              {/* Text */}
              <div className="min-w-0">
                <h3 className="font-bold text-brand-navy text-lg mb-1.5 group-hover:text-brand-teal transition-colors">
                  {cat.name}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-3">
                  {cat.description}
                </p>
                <span className="text-brand-slate text-xs font-medium bg-gray-50 px-2.5 py-1 rounded-full">
                  {cat.count}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Decorative bottom note */}
        <p className="text-center text-brand-slate text-sm mt-12">
          More experiences added every week.{" "}
          <Link href="#" className="text-brand-teal font-medium hover:underline">
            Subscribe for updates
          </Link>
        </p>
      </div>
    </section>
  );
}

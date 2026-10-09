import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us — CaribGateway",
  description: "What CaribGateway is, how its listings work, and how Caribbean businesses can take part.",
};

const POINTS = [
  {
    heading: "What CaribGateway is",
    body: "CaribGateway is a guide to the Caribbean. It brings together destinations, places to stay, restaurants, tours, attractions and transport, so you can plan a trip without opening a dozen websites.",
  },
  {
    heading: "How listings work",
    body: "Each listing shows what visitors ask about first: where it is, when it is open, its price range, the services it offers and how to get in touch. Businesses keep their own details up to date, and our team checks each new listing before it goes live.",
  },
  {
    heading: "For businesses",
    body: "If you run a hotel, restaurant, tour operator or attraction, you can list it on CaribGateway, manage its services and prices, and see how visitors find you.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-teal-dark pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-brand-coral font-semibold text-sm uppercase tracking-widest mb-3">About CaribGateway</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Your gateway to the Caribbean
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-3xl leading-relaxed">
            Where to stay, what to eat, what to do and how to get around, across the islands, in one place.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 md:grid-cols-3">
          {POINTS.map((point) => (
            <article key={point.heading} className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <h2 className="text-xl font-semibold text-brand-navy mb-3">{point.heading}</h2>
              <p className="text-gray-600 leading-7">{point.body}</p>
            </article>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 flex flex-wrap items-center gap-3">
          <Link
            href="/destinations"
            className="inline-flex items-center gap-2 bg-brand-navy text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-navy-dark transition-colors"
          >
            Explore destinations
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-brand-navy font-semibold px-6 py-3 rounded-full ring-1 ring-gray-300 hover:bg-gray-50 transition-colors"
          >
            Get in touch
          </Link>
          <Link href="/dashboard/login" className="text-sm font-semibold text-brand-teal hover:underline">
            Business sign-in
          </Link>
        </div>
      </section>
    </>
  );
}

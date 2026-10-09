import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/site/ContactForm";
import { getSiteContent } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Contact Us — CaribGateway",
  description: "Send CaribGateway a question about a destination, a listing or your account.",
};

export default async function ContactPage() {
  const content = await getSiteContent();

  return (
    <>
      <section className="relative bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-teal-dark pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-brand-coral font-semibold text-sm uppercase tracking-widest mb-3">Contact us</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">Get in touch</h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-3xl leading-relaxed">
            Questions about a destination, a listing or your account? Send us a message and we will reply as soon as we can.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-xl font-semibold text-brand-navy mb-6">Send us a message</h2>
            <ContactForm />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h2 className="text-lg font-semibold text-brand-navy mb-4">Follow us</h2>
              <ul className="space-y-3">
                {content.footer.social.map((item) => (
                  <li key={`${item.label}-${item.href}`}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-brand-teal hover:underline"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h2 className="text-lg font-semibold text-brand-navy mb-2">Run a business here?</h2>
              <p className="text-sm leading-6 text-gray-600 mb-4">
                Changes to a listing are easiest to make from your business dashboard, where they go straight to the
                right place.
              </p>
              <Link href="/dashboard/login" className="text-sm font-semibold text-brand-teal hover:underline">
                Sign in to your dashboard
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

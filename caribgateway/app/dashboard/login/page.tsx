import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PartnerSignIn from "@/components/dashboard/PartnerSignIn";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { getStaff } from "@/lib/staff";
import { canUseDashboard } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Sign in to your dashboard — CaribGateway",
  robots: "noindex,nofollow",
};

export const dynamic = "force-dynamic";

const BENEFITS: { icon: IconName; text: string }[] = [
  { icon: "tag", text: "Update your prices and services any time" },
  { icon: "camera", text: "Add photos that show your best side" },
  { icon: "chart", text: "See how visitors find and contact you" },
];

export default async function DashboardSignInPage() {
  // Already signed in as an operator: go straight to the dashboard.
  const staff = await getStaff();
  if (staff && canUseDashboard(staff.permissions)) redirect("/dashboard");

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-brand-teal/[0.08] to-transparent" />
      <div className="relative mx-auto grid min-h-screen max-w-5xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <section className="hidden lg:block">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal text-lg font-bold text-white">
            C
          </span>
          <h1 className="mt-8 text-4xl font-semibold leading-tight tracking-tight text-brand-navy">
            Your business, always up to date.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
            Manage your CaribGateway listings in one place. Changes are checked before they go live.
          </p>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit.text} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                  <Icon name={benefit.icon} className="h-5 w-5" />
                </span>
                {benefit.text}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200/80 sm:p-10">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal text-base font-bold text-white">
                C
              </span>
              <span className="text-sm font-semibold text-brand-navy">Operator dashboard</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-brand-navy">Sign in</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">Use the email and password we gave you.</p>
            <div className="mt-6">
              <PartnerSignIn />
            </div>
          </div>
          <p className="mt-6 text-center text-sm leading-6 text-slate-500">
            New here? The CaribGateway team sets up your listing, then you can sign in.
          </p>
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { requireDashboard } from "@/lib/staff";
import { canUseAdminPanel } from "@/lib/permissions";
import { signOutOfDashboard } from "@/lib/actions/auth";
import { Icon } from "@/components/dashboard/icons";
import { PageHeader, buttonClass, cardClass } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Account — Operator dashboard" };

export default async function AccountPage() {
  const staff = await requireDashboard();
  const isAdmin = canUseAdminPanel(staff.permissions);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Your account" title="Account" description="Your details, and how you sign in." />

      <section className={cardClass + " p-6"}>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{staff.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 break-all text-sm font-semibold text-slate-900">{staff.email || "Not set"}</dd>
          </div>
        </dl>
      </section>

      <section className={cardClass + " p-6"}>
        <h2 className="text-base font-semibold text-brand-navy">Need a change?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          To change your sign-in details, add a new listing, or set up a different team, contact the CaribGateway team.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-brand-teal hover:underline">
          Back to the CaribGateway website →
        </Link>
      </section>

      {isAdmin && (
        <section className={cardClass + " p-6"}>
          <h2 className="text-base font-semibold text-brand-navy">Admin access</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your account can also manage the whole site. The admin panel is separate from this dashboard.
          </p>
          <Link href="/admin" className={buttonClass("secondary", "mt-4")}>
            Open the admin panel
          </Link>
        </section>
      )}

      <form action={signOutOfDashboard}>
        <button type="submit" className={buttonClass("secondary")}>
          <Icon name="logout" className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </div>
  );
}

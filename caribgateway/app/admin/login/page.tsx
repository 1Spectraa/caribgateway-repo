"use client";

import { useActionState } from "react";
import { loginAdmin, type AuthState } from "@/lib/actions/auth";

const FIELD =
  "block w-full rounded-[var(--radius-control)] border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-teal focus:outline-none focus:ring-4 focus:ring-brand-teal/20";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAdmin, null);

  return (
    <div className="grid h-full overflow-y-auto bg-gray-50 lg:grid-cols-[minmax(0,1fr)_30rem]">
      {/* The brand panel, beside the form on wide screens */}
      <aside className="hidden flex-col justify-between bg-gray-900 p-12 text-gray-100 lg:flex">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-md bg-brand-coral text-sm font-bold text-gray-900"
          >
            CG
          </span>
          <span className="text-sm font-semibold text-white">CaribGateway</span>
        </div>
        <div className="max-w-lg">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-300/70">Admin console</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white">
            Keep the directory accurate and the site current.
          </h1>
          <p className="mt-4 text-sm leading-6 text-gray-300">
            Approve new listings, manage destinations and accounts, edit site copy, and see how listings perform.
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-300/60">Staff only</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-md bg-gray-900 text-xs font-bold text-brand-coral"
            >
              CG
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-600">
              CaribGateway · Admin console
            </span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Sign in</h2>
          <p className="mt-1.5 text-sm text-gray-600">Admin access only.</p>

          <form action={action} className="mt-8 space-y-5">
            {state?.error && (
              <div
                role="alert"
                className="rounded-[var(--radius-control)] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
              >
                {state.error}
              </div>
            )}

            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-gray-800">
                Email or username
              </label>
              {/* Plain text, not type="email": the emergency account's username is "admin", and the browser would block it. */}
              <input
                id="admin-email"
                name="email"
                type="text"
                required
                autoFocus
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@example.com"
                className={FIELD}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-gray-800">
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className={FIELD}
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-[var(--radius-control)] bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

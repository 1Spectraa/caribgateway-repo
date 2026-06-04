"use client";

import { useActionState } from "react";
import { loginAdmin, type AuthState } from "@/lib/actions/auth";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    loginAdmin,
    null,
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">CaribGateway</h1>
          <p className="text-sm text-gray-500 mt-0.5">Admin access only</p>
        </div>

        <form action={action} className="space-y-4">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { login, type AuthState } from "@/lib/actions/auth";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    login,
    null,
  );
  const params = useSearchParams();
  const registered = params.get("registered") === "1";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-brand-teal rounded-xl flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
          </svg>
        </div>
        <span className="font-bold text-lg text-brand-navy">CaribGateway</span>
      </Link>

      <h1 className="text-2xl font-bold text-brand-navy mb-1">Welcome back</h1>
      <p className="text-sm text-gray-500 mb-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-brand-teal hover:underline font-medium">
          Sign up
        </Link>
      </p>

      {registered && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 rounded-lg text-sm mb-4">
          Account created! Check your email to confirm, then sign in.
        </div>
      )}

      <form action={action} className="space-y-4">
        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
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
            placeholder="jane@example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-brand-coral hover:bg-brand-coral-dark text-white text-sm font-semibold py-3 rounded-full transition-colors disabled:opacity-50 mt-2"
        >
          {pending ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

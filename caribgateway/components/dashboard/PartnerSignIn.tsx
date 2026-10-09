"use client";

import { useActionState } from "react";
import { loginDashboard, type AuthState } from "@/lib/actions/auth";
import { keepFieldsOnSubmit } from "@/components/admin/keep-fields";
import { Notice, buttonClass, inputClass, labelClass } from "@/components/dashboard/ui";

export default function PartnerSignIn() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(loginDashboard, null);

  return (
    <form onSubmit={keepFieldsOnSubmit(formAction)} className="space-y-5">
      {state?.error && <Notice tone="error">{state.error}</Notice>}

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="you@yourbusiness.com"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

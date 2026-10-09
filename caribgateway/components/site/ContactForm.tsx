"use client";

import { useActionState, useId } from "react";
import { keepFieldsOnSubmit } from "@/components/admin/keep-fields";
import { sendContactMessage, type ContactState } from "@/lib/actions/contact";

const FIELD =
  "block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-teal focus:outline-none focus:ring-4 focus:ring-brand-teal/15";

const LABEL = "mb-2 block text-sm font-medium text-gray-800";

/**
 * The Contact page form. Submitted by hand (keepFieldsOnSubmit), so a rejected message keeps
 * what the visitor typed.
 */
export default function ContactForm() {
  const id = useId();
  const [state, formAction, pending] = useActionState<ContactState, FormData>(sendContactMessage, null);

  if (state && "sent" in state) {
    return (
      <div role="status" className="rounded-2xl bg-emerald-50 p-8 ring-1 ring-inset ring-emerald-200">
        <h2 className="text-xl font-semibold text-emerald-900">Thanks, your message has been sent.</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900/80">
          We read every message and reply to the email address you gave us.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={keepFieldsOnSubmit(formAction)} className="relative space-y-6">
      {state && "error" in state && (
        <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900 ring-1 ring-inset ring-rose-200">
          {state.error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className={LABEL}>
            Your name <span className="text-rose-600">*</span>
          </label>
          <input id={`${id}-name`} name="name" type="text" required maxLength={120} autoComplete="name" className={FIELD} />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={LABEL}>
            Email address <span className="text-rose-600">*</span>
          </label>
          <input id={`${id}-email`} name="email" type="email" required maxLength={200} autoComplete="email" className={FIELD} />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-message`} className={LABEL}>
          Message <span className="text-rose-600">*</span>
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          placeholder="How can we help?"
          className={FIELD}
        />
      </div>

      {/* Hidden from people. Bots tend to fill in every field, which is how their messages are caught. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-teal-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

import { startTransition, type FormEvent } from "react";

/**
 * Submits a form through a server action without letting React clear it.
 *
 * Passing a form to `action` makes React reset every field after each submit,
 * even when the action returns an error, so a rejected save wiped everything
 * that had been typed. Here the form is submitted by hand instead, so the
 * fields stay put when there is an error. A successful save redirects away anyway.
 */
export function keepFieldsOnSubmit(dispatch: (payload: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = new FormData(event.currentTarget);
    startTransition(() => dispatch(payload));
  };
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthFormState } from "@/app/actions/auth";
import { AlertIcon, CheckIcon } from "@/components/icons";

const INITIAL_STATE: AuthFormState = {};

/** The email + password form used by both /login and /signup. */
export function AuthForm({ mode, notice }: { mode: "login" | "signup"; notice?: string }) {
  const isSignup = mode === "signup";
  const [state, formAction, isPending] = useActionState(isSignup ? signup : login, INITIAL_STATE);

  if (state.notice) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckIcon className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Check your email</h2>
        <p role="status" className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {state.notice}
        </p>
        <Link href="/login" className="btn btn-primary mt-6">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {notice ? (
        <p
          role="status"
          className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:bg-sky-950 dark:text-sky-100"
        >
          {notice}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="field"
          autoComplete="email"
          defaultValue={state.email ?? ""}
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={isSignup ? 8 : undefined}
          aria-describedby={isSignup ? "password-hint" : undefined}
          required
        />
        {isSignup ? (
          <p id="password-hint" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            At least 8 characters.
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
        {isPending
          ? isSignup
            ? "Creating your account…"
            : "Logging in…"
          : isSignup
            ? "Create account"
            : "Log in"}
      </button>

      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

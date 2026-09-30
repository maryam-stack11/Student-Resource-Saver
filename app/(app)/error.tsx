"use client";

import { AlertIcon } from "@/components/icons";

/** Shown if a private page fails to load, instead of a blank screen. */
export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="card mx-auto flex max-w-md flex-col items-center px-6 py-12 text-center" role="alert">
      <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300">
        <AlertIcon className="size-6" />
      </div>
      <h1 className="mt-4 text-lg font-semibold">We couldn&apos;t load this page</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        This is usually a brief internet or server hiccup. Your saved resources are safe.
      </p>
      <button type="button" className="btn btn-primary mt-5" onClick={() => retry()}>
        Try again
      </button>
    </div>
  );
}

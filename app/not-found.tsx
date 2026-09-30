import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        That page doesn&apos;t exist. Let&apos;s get you back to your library.
      </p>
      <Link href="/dashboard" className="btn btn-primary mt-6">
        Go to my library
      </Link>
    </main>
  );
}

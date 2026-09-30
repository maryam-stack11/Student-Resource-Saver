/** Shown instead of the app when .env.local has not been filled in yet. */
export function SetupNeeded() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16">
      <div className="card p-6">
        <h1 className="text-xl font-semibold">One setup step is missing</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          The app can&apos;t find its Supabase settings, so it doesn&apos;t know which database to
          talk to yet.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
          <li>
            In the project folder, make a copy of <code className="font-mono">.env.example</code> and
            name the copy <code className="font-mono">.env.local</code>.
          </li>
          <li>
            Open <code className="font-mono">.env.local</code> and paste your Supabase Project URL and
            publishable key (README → &quot;Set up Supabase&quot; shows where to find them).
          </li>
          <li>
            Stop the app (Ctrl + C in the terminal) and start it again with{" "}
            <code className="font-mono">npm run dev</code>.
          </li>
        </ol>
      </div>
    </main>
  );
}

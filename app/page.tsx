import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { Brand } from "@/components/app-header";
import { BookIcon, CheckIcon, FolderIcon, SearchIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  {
    icon: BookIcon,
    title: "Save anything",
    text: "YouTube videos, PDFs, GitHub repos, courses, articles and Drive files, all in one library.",
  },
  {
    icon: FolderIcon,
    title: "Organize by subject",
    text: "Group links into categories like C++ or Physics, and add tags like Exam or Assignment.",
  },
  {
    icon: SearchIcon,
    title: "Find it in seconds",
    text: "Search titles, tags and notes at once. Filter by subject, type or study status.",
  },
  {
    icon: CheckIcon,
    title: "Track your progress",
    text: "Mark each resource To Study, In Progress or Completed, and star your favorites.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser().catch(() => null);

  return (
    <>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Brand href="/" />
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
        <section className="py-12 text-center sm:py-20">
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            All your study links, finally in one place
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-pretty text-slate-600 dark:text-slate-300">
            Stop digging through bookmarks and WhatsApp chats. Save useful resources, sort them by
            subject, add notes, and track what you have studied.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {user ? (
              <Link href="/dashboard" className="btn btn-primary min-h-12 px-6 text-base">
                Open my library
              </Link>
            ) : (
              <>
                <Link href="/signup" className="btn btn-primary min-h-12 px-6 text-base">
                  Sign up free
                </Link>
                <Link href="/login" className="btn btn-secondary min-h-12 px-6 text-base">
                  Log in
                </Link>
              </>
            )}
          </div>
        </section>

        <section aria-label="Features" className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <feature.icon className="size-5" />
              </div>
              <h2 className="mt-3 font-semibold">{feature.title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{feature.text}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}

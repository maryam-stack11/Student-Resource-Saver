"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { BookIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "/dashboard", label: "Library" },
  { href: "/favorites", label: "Favorites" },
  { href: "/categories", label: "Categories" },
];

export function Brand({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-lg font-semibold">
      <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <BookIcon className="size-4" />
      </span>
      <span className="text-sm whitespace-nowrap sm:text-base">Study Resource Saver</span>
    </Link>
  );
}

/** Top bar for logged-in pages: logo, page links, theme switch, log out. */
export function AppHeader({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 sm:gap-x-4 sm:px-6">
        <Brand href="/dashboard" />

        <div className="ml-auto flex items-center gap-1 sm:order-3">
          <span
            className="hidden max-w-48 truncate text-sm text-slate-500 lg:block dark:text-slate-400"
            title={email}
          >
            {email}
          </span>
          <ThemeToggle />
          <form action={logout}>
            <button type="submit" className="btn btn-secondary min-h-9 px-3">
              Log out
            </button>
          </form>
        </div>

        <nav aria-label="Main" className="-mx-1 flex w-full gap-1 overflow-x-auto sm:order-2 sm:mx-0 sm:ml-4 sm:w-auto">
          {NAV_LINKS.map((link) => {
            const isCurrent = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isCurrent ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap ${
                  isCurrent
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

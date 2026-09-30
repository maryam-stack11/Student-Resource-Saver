import type { Metadata, Viewport } from "next";
import "./globals.css";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupNeeded } from "@/components/setup-needed";
import { themeInitScript } from "@/components/theme-toggle";
import { ToastProvider } from "@/components/toast";

export const metadata: Metadata = {
  title: {
    default: "Study Resource Saver",
    template: "%s · Study Resource Saver",
  },
  description:
    "One organized place for your study links: videos, PDFs, repos, courses and articles, with categories, tags, notes and progress tracking.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the theme script may add the "dark" class before React starts.
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ToastProvider>{isSupabaseConfigured() ? children : <SetupNeeded />}</ToastProvider>
      </body>
    </html>
  );
}

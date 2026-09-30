import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

/** Pages that need a logged-in user. */
const PROTECTED_PREFIXES = ["/dashboard", "/favorites", "/categories"];
/** Pages that make no sense once you are logged in. */
const AUTH_PAGES = ["/login", "/signup"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Runs before every page request. It:
 *  1. refreshes the login session (so users are not randomly logged out), and
 *  2. sends logged-out visitors away from private pages.
 * Follows the official Supabase + Next.js guide.
 */
export async function updateSession(request: NextRequest) {
  // Without settings there is nothing to refresh; the app shows a setup screen.
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([name, value]) =>
          supabaseResponse.headers.set(name, value),
        );
      },
    },
  });

  // IMPORTANT: do not add code between createServerClient and getClaims().
  let isLoggedIn = false;
  try {
    const { data } = await supabase.auth.getClaims();
    isLoggedIn = Boolean(data?.claims?.sub);
  } catch {
    // Supabase unreachable: treat as logged out rather than crashing every page.
    isLoggedIn = false;
  }

  const { pathname } = request.nextUrl;

  // Email-confirmation links can land on the home page with "?code=...".
  // Hand them to /auth/confirm, which finishes the login.
  if (pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const target = request.nextUrl.clone();
    target.pathname = "/auth/confirm";
    return NextResponse.redirect(target);
  }

  let redirectTo: string | null = null;
  if (!isLoggedIn && matches(pathname, PROTECTED_PREFIXES)) redirectTo = "/login";
  if (isLoggedIn && matches(pathname, AUTH_PAGES)) redirectTo = "/dashboard";

  if (redirectTo) {
    const target = request.nextUrl.clone();
    target.pathname = redirectTo;
    target.search = "";
    const redirectResponse = NextResponse.redirect(target);
    // Keep any refreshed session cookies on the redirect.
    supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return supabaseResponse;
}

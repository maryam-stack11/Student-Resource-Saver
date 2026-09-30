"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { credentialsSchema, firstIssue, signupSchema } from "@/lib/validation";

export type AuthFormState = {
  error?: string;
  /** Shown instead of the form, e.g. "check your inbox". */
  notice?: string;
  email?: string;
};

const NOT_CONFIGURED =
  "The app is not connected to Supabase yet. Add your keys to .env.local (see README) and restart.";
const NETWORK_ERROR =
  "We couldn't reach the server. Check your internet connection and try again.";

/** Turn Supabase's technical error codes into friendly sentences. */
function friendlyAuthError(code: string | undefined, fallback: string): string {
  switch (code) {
    case "invalid_credentials":
      return "Wrong email or password. Please try again.";
    case "email_not_confirmed":
      return "Please confirm your email first. Check your inbox for the confirmation link.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try logging in instead.";
    case "weak_password":
      return "That password is too easy to guess. Please choose a stronger one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts right now. Please wait a few minutes and try again.";
    case "email_address_invalid":
      return "That email address doesn't look right. Please check it.";
    case "signup_disabled":
      return "New sign-ups are currently turned off for this app.";
    default:
      return fallback;
  }
}

export async function login(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = credentialsSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { error: firstIssue(parsed.error), email };
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED, email };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      return {
        error: friendlyAuthError(error.code, "We couldn't log you in. Please try again."),
        email,
      };
    }
  } catch {
    return { error: NETWORK_ERROR, email };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = signupSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { error: firstIssue(parsed.error), email };
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED, email };

  let needsEmailConfirmation = false;
  try {
    const supabase = await createClient();
    const origin = (await headers()).get("origin");
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: origin ? { emailRedirectTo: `${origin}/auth/confirm` } : undefined,
    });
    if (error) {
      return {
        error: friendlyAuthError(error.code, "We couldn't create your account. Please try again."),
        email,
      };
    }
    // Supabase hides "email already registered" for privacy: it returns a
    // user with no identities instead of an error.
    if (data.user && data.user.identities?.length === 0) {
      return { error: friendlyAuthError("user_already_exists", ""), email };
    }
    needsEmailConfirmation = !data.session;
  } catch {
    return { error: NETWORK_ERROR, email };
  }

  if (needsEmailConfirmation) {
    return {
      notice: `Almost there! We sent a confirmation link to ${parsed.data.email}. Click it, then log in.`,
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Even if Supabase is unreachable, send the user to the login page.
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

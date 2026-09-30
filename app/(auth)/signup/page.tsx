import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600 dark:text-slate-300">
        Free, and only you can see what you save.
      </p>
      <AuthForm mode="signup" />
    </div>
  );
}

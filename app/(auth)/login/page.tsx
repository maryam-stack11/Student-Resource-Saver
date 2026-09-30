import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string | string[] }>;
}) {
  const { notice } = await searchParams;

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600 dark:text-slate-300">
        Log in to open your study library.
      </p>
      <AuthForm
        mode="login"
        notice={
          notice === "confirm"
            ? "If you just confirmed your email, you're all set. Log in below."
            : undefined
        }
      />
    </div>
  );
}

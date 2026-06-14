"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { login, signup, type AuthState } from "./actions";

function SubmitButton({
  label,
  formAction,
}: {
  label: string;
  formAction: (formData: FormData) => void;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
    >
      {pending ? "Please wait…" : label}
    </button>
  );
}

export default function LoginForm() {
  const [loginState, loginAction] = useActionState<AuthState, FormData>(
    login,
    {},
  );
  const [signupState, signupAction] = useActionState<AuthState, FormData>(
    signup,
    {},
  );

  async function handleGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/routines`,
      },
    });
    if (error) {
      alert(
        "Google sign-in isn't configured for this project yet. Use email & password, or enable the Google provider in Supabase.",
      );
    }
  }

  const message = loginState.message || signupState.message;
  const error = loginState.error || signupState.error;

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-2xl">
          ⏱️
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Routinery</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Build better routines, one task at a time.
        </p>
      </div>

      <form className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-medium text-zinc-400">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-indigo-500/40 placeholder:text-zinc-600 focus:ring-2"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-xs font-medium text-zinc-400"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-indigo-500/40 placeholder:text-zinc-600 focus:ring-2"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {message}
          </p>
        )}

        <div className="space-y-2">
          <SubmitButton label="Log in" formAction={loginAction} />
          <button
            type="submit"
            formAction={signupAction}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-surface-2"
          >
            Create account
          </button>
        </div>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-bg px-2 text-xs text-zinc-500">or</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-surface-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}

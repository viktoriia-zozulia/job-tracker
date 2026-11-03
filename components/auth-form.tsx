"use client";

import Link from "next/link";
import { useActionState } from "react";

import { logIn, signUp, type AuthFormState } from "@/lib/actions/auth";

const MODES = {
  login: {
    action: logIn,
    title: "Log in",
    submit: "Log in",
    pending: "Logging in…",
    autoComplete: "current-password",
    prompt: "Don't have an account?",
    linkHref: "/signup",
    linkText: "Sign up",
  },
  signup: {
    action: signUp,
    title: "Create your account",
    submit: "Sign up",
    pending: "Signing up…",
    autoComplete: "new-password",
    prompt: "Already have an account?",
    linkHref: "/login",
    linkText: "Log in",
  },
} as const;

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700";

const initialState: AuthFormState = {};

export function AuthForm({ mode }: { mode: keyof typeof MODES }) {
  const config = MODES[mode];
  const [state, formAction, pending] = useActionState(
    config.action,
    initialState,
  );

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-8">
      <h1 className="text-2xl font-semibold">{config.title}</h1>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <label className="text-sm font-medium">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            defaultValue={state.email}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-medium">
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete={config.autoComplete}
            className={inputClass}
          />
        </label>

        {state.error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? config.pending : config.submit}
        </button>
      </form>

      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        {config.prompt}{" "}
        <Link href={config.linkHref} className="font-medium underline">
          {config.linkText}
        </Link>
      </p>
    </main>
  );
}

"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth-actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-medium text-ink">
            Ma Revue de Presse
          </h1>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="password"
              className="font-body block text-sm text-ink-soft"
            >
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="font-body mt-1.5 w-full border-b border-rule bg-transparent pb-2 text-base text-ink outline-none focus:border-accent"
            />
          </div>

          {state.error ? (
            <p className="font-body text-sm text-accent-alert">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="font-body mt-2 w-full border border-ink py-2.5 text-sm font-medium text-ink transition hover:bg-ink hover:text-paper disabled:opacity-50"
          >
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}

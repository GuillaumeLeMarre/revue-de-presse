"use client";

import { useActionState, useState } from "react";
import { createSource, type SourceFormState } from "@/lib/sources-actions";

const initialState: SourceFormState = {};

export function SourceForm({
  categories,
}: {
  categories: Array<{ id: number; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(
    createSource,
    initialState
  );
  const [type, setType] = useState<"google_news" | "rss">("google_news");

  return (
    <form action={formAction} className="flex flex-col gap-4 pt-2">
      <fieldset className="font-body flex gap-5 text-sm text-ink">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="type"
            value="google_news"
            checked={type === "google_news"}
            onChange={() => setType("google_news")}
            className="accent-accent"
          />
          Recherche Google News
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="type"
            value="rss"
            checked={type === "rss"}
            onChange={() => setType("rss")}
            className="accent-accent"
          />
          Flux RSS
        </label>
      </fieldset>

      <div>
        <label className="font-body block text-sm text-ink-soft">Nom</label>
        <input
          name="name"
          required
          className="font-body mt-1 w-full border-b border-rule bg-transparent pb-1.5 text-sm text-ink outline-none focus:border-accent"
        />
      </div>

      {type === "google_news" ? (
        <div>
          <label className="font-body block text-sm text-ink-soft">
            Recherche
          </label>
          <input
            name="query"
            placeholder="Intelligence artificielle"
            className="font-body mt-1 w-full border-b border-rule bg-transparent pb-1.5 text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-accent"
          />
        </div>
      ) : (
        <div>
          <label className="font-body block text-sm text-ink-soft">
            URL RSS
          </label>
          <input
            name="rssUrl"
            placeholder="https://..."
            className="font-body mt-1 w-full border-b border-rule bg-transparent pb-1.5 text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-accent"
          />
        </div>
      )}

      <div>
        <label className="font-body block text-sm text-ink-soft">
          Catégorie
        </label>
        <select
          name="categoryId"
          required
          className="font-body mt-1 w-full border-b border-rule bg-transparent pb-1.5 text-sm text-ink outline-none focus:border-accent"
        >
          <option value="">Sélectionner…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {state.error ? (
        <p className="font-body text-sm text-accent-alert">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="font-body w-fit border border-ink px-4 py-2 text-sm font-medium text-ink transition hover:bg-ink hover:text-paper disabled:opacity-50"
      >
        {pending ? "Ajout…" : "Ajouter la source"}
      </button>
    </form>
  );
}

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
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
    >
      <fieldset className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="type"
            value="google_news"
            checked={type === "google_news"}
            onChange={() => setType("google_news")}
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
          />
          Flux RSS
        </label>
      </fieldset>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nom
        </label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
        />
      </div>

      {type === "google_news" ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Recherche
          </label>
          <input
            name="query"
            placeholder="Intelligence artificielle"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            URL RSS
          </label>
          <input
            name="rssUrl"
            placeholder="https://..."
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Catégorie
        </label>
        <select
          name="categoryId"
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="">Sélectionner...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900"
      >
        {pending ? "Ajout..." : "+ Ajouter"}
      </button>
    </form>
  );
}

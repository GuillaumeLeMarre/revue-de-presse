"use client";

import { useActionState, useTransition } from "react";
import {
  toggleCategory,
  deleteCategory,
  deleteArticlesByCategory,
} from "@/lib/categories-actions";
import {
  createSubcategory,
  toggleSubcategory,
  deleteSubcategory,
  deleteArticlesBySubcategory,
  type SubcategoryFormState,
} from "@/lib/subcategories-actions";

interface CategoryData {
  id: number;
  name: string;
  type: string | null;
  query: string | null;
  rssUrl: string | null;
  enabled: boolean;
  lastFetchedAt: Date | null;
}

interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  enabled: boolean;
}

const initialState: SubcategoryFormState = {};

function formatDate(date: Date | null): string {
  if (!date) return "jamais";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(date);
}

export function CategorySection({
  category,
  subcategories,
}: {
  category: CategoryData;
  subcategories: Subcategory[];
}) {
  const [isPending, startTransition] = useTransition();
  const [state, formAction, isSubmitting] = useActionState(
    createSubcategory,
    initialState
  );

  return (
    <div className="flex flex-col gap-3 border-b border-rule py-5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
        <span className="font-display text-base text-ink">{category.name}</span>
        <div className="font-body flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => toggleCategory(category.id, !category.enabled))
            }
            className="py-1 text-ink-soft hover:text-ink disabled:opacity-50"
          >
            {category.enabled ? "active" : "inactive"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (
                confirm(
                  `Supprimer tous les articles de la catégorie "${category.name}" ?`
                )
              ) {
                startTransition(() => deleteArticlesByCategory(category.id));
              }
            }}
            className="py-1 text-ink-soft hover:text-ink disabled:opacity-50"
          >
            Vider les articles
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (confirm(`Supprimer la catégorie "${category.name}" ?`)) {
                startTransition(() => deleteCategory(category.id));
              }
            }}
            className="py-1 text-accent-alert hover:underline disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
      </div>
      <p className="font-body text-xs text-ink-soft">
        {category.type === "google_news"
          ? `Google News · ${category.query ?? ""}`
          : category.type === "rss"
            ? `RSS · ${category.rssUrl ?? ""}`
            : "Aucune recherche configurée"}
        {" · dernière récupération : "}
        {formatDate(category.lastFetchedAt)}
      </p>

      <div className="flex flex-col gap-2 pl-4">
        <span className="font-body text-xs font-medium uppercase tracking-wide text-ink-soft">
          Sous-catégories
        </span>

        {subcategories.length === 0 ? (
          <p className="font-body text-xs text-ink-soft">Aucune sous-catégorie.</p>
        ) : (
          subcategories.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-2 rounded-md bg-card px-3 py-2 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-body text-sm font-medium text-ink">
                  {s.name}
                </span>
                <span className="font-body text-xs text-ink-soft">
                  {s.description}
                </span>
              </div>
              <div className="font-body flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => toggleSubcategory(s.id, !s.enabled))
                  }
                  className="py-1 text-ink-soft hover:text-ink disabled:opacity-50"
                >
                  {s.enabled ? "active" : "inactive"}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (
                      confirm(
                        `Supprimer tous les articles de la sous-catégorie "${s.name}" ?`
                      )
                    ) {
                      startTransition(() => deleteArticlesBySubcategory(s.id));
                    }
                  }}
                  className="py-1 text-ink-soft hover:text-ink disabled:opacity-50"
                >
                  Vider
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (confirm(`Supprimer la sous-catégorie "${s.name}" ?`)) {
                      startTransition(() => deleteSubcategory(s.id));
                    }
                  }}
                  className="py-1 text-accent-alert hover:underline disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}

        <form action={formAction} className="flex flex-col gap-2 pt-1">
          <input type="hidden" name="categoryId" value={category.id} />
          <input
            type="text"
            name="name"
            placeholder={`Nom (ex : ${category.name} — volet spécifique)`}
            className="font-body rounded-md border border-rule bg-card px-3 py-1.5 text-sm text-ink placeholder:text-ink-soft/60"
          />
          <textarea
            name="description"
            rows={2}
            placeholder={`Critère de pertinence (ex : quels sujets, faits ou contextes précis doivent apparaître dans un article ${category.name.toLowerCase()} pour appartenir à ce volet)`}
            className="font-body resize-none rounded-md border border-rule bg-card px-3 py-1.5 text-sm text-ink placeholder:text-ink-soft/60"
          />
          {state.error ? (
            <p className="font-body text-xs text-accent-alert">{state.error}</p>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="font-body self-start text-xs font-medium text-accent hover:underline disabled:opacity-50"
          >
            Ajouter une sous-catégorie
          </button>
        </form>
      </div>
    </div>
  );
}

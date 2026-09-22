"use client";

import { useTransition } from "react";
import {
  toggleCategory,
  deleteCategory,
  deleteArticlesByCategory,
} from "@/lib/categories-actions";

interface CategoryRowData {
  id: number;
  name: string;
  type: string | null;
  query: string | null;
  rssUrl: string | null;
  enabled: boolean;
  lastFetchedAt: Date | null;
}

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

export function CategoryRow({ category }: { category: CategoryRowData }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1.5 border-b border-rule py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-base text-ink">{category.name}</span>
        <div className="font-body flex items-center gap-3 text-xs">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => toggleCategory(category.id, !category.enabled))
            }
            className="text-ink-soft hover:text-ink disabled:opacity-50"
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
            className="text-ink-soft hover:text-ink disabled:opacity-50"
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
            className="text-accent-alert hover:underline disabled:opacity-50"
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
    </div>
  );
}

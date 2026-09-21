"use client";

import { useTransition } from "react";
import {
  toggleSource,
  deleteSource,
  deleteArticlesBySource,
} from "@/lib/sources-actions";
import type { SourceRowData } from "@/lib/sources-query";

function formatDate(date: Date | null): string {
  if (!date) return "jamais";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SourceRow({ source }: { source: SourceRowData }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-0 dark:border-gray-800">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {source.name}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => toggleSource(source.id, !source.enabled))
            }
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <span className={source.enabled ? "text-green-600" : "text-gray-400"}>
              ●
            </span>
            {source.enabled ? "actif" : "inactif"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (
                confirm(
                  `Supprimer tous les articles collectés via "${source.name}" ?`
                )
              ) {
                startTransition(() => deleteArticlesBySource(source.id));
              }
            }}
            className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-100"
          >
            Vider les articles
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (confirm(`Supprimer la source "${source.name}" ?`)) {
                startTransition(() => deleteSource(source.id));
              }
            }}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {source.type === "google_news" ? "Google News" : "RSS"}
        {source.categoryName ? ` • ${source.categoryName}` : ""}
        {" • Dernière récupération : "}
        {formatDate(source.lastFetchedAt)}
      </p>
    </div>
  );
}

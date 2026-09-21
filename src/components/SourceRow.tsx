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
    timeZone: "Europe/Paris",
  }).format(date);
}

export function SourceRow({ source }: { source: SourceRowData }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1.5 border-b border-rule py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-base text-ink">{source.name}</span>
        <div className="font-body flex items-center gap-3 text-xs">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => toggleSource(source.id, !source.enabled))
            }
            className="text-ink-soft hover:text-ink disabled:opacity-50"
          >
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
            className="text-ink-soft hover:text-ink disabled:opacity-50"
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
            className="text-accent-alert hover:underline disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
      </div>
      <p className="font-body text-xs text-ink-soft">
        {source.type === "google_news" ? "Google News" : "RSS"}
        {source.categoryName ? ` · ${source.categoryName}` : ""}
        {" · dernière récupération : "}
        {formatDate(source.lastFetchedAt)}
      </p>
    </div>
  );
}

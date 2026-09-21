"use client";

import { useMemo, useState, useTransition } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { refreshFeed, loadMoreArticles } from "@/lib/feed-actions";
import type { ArticleCardData } from "@/lib/articles-query";

interface Category {
  id: number;
  name: string;
  slug: string;
}

export function RevueClient({
  initialArticles,
  categories,
}: {
  initialArticles: ArticleCardData[];
  categories: Category[];
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const [isLoadingMore, startLoadMore] = useTransition();
  const [hasMore, setHasMore] = useState(initialArticles.length > 0);

  const filtered = useMemo(
    () =>
      selectedSlug
        ? articles.filter((a) => a.categorySlug === selectedSlug)
        : articles,
    [articles, selectedSlug]
  );

  function handleRefresh() {
    setStatus("Actualisation en cours...");
    startRefresh(async () => {
      const result = await refreshFeed();
      setStatus(result.message);
      if (result.newArticles > 0) {
        const fresh = await loadMoreArticles(
          articles[0]?.id ? articles[0].id + 1 : Number.MAX_SAFE_INTEGER
        );
        setArticles((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const merged = [...fresh.filter((a) => !existingIds.has(a.id)), ...prev];
          return merged;
        });
      }
    });
  }

  function handleLoadMore() {
    const lastId = articles.at(-1)?.id;
    if (!lastId) return;
    startLoadMore(async () => {
      const more = await loadMoreArticles(lastId);
      setArticles((prev) => [...prev, ...more]);
      if (more.length === 0) setHasMore(false);
    });
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          📰 Ma Revue de Presse
        </h1>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{status ?? " "}</span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {isRefreshing ? "Actualisation..." : "↻ Actualiser"}
          </button>
        </div>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        <TabButton
          label="Tous"
          active={selectedSlug === null}
          onClick={() => setSelectedSlug(null)}
        />
        {categories.map((c) => (
          <TabButton
            key={c.id}
            label={c.name}
            active={selectedSlug === c.slug}
            onClick={() => setSelectedSlug(c.slug)}
          />
        ))}
      </nav>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          Aucun article pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {hasMore ? (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className="mx-auto mt-2 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {isLoadingMore ? "Chargement..." : "Charger plus"}
        </button>
      ) : null}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

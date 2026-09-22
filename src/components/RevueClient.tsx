"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import {
  refreshFeed,
  loadArticlesForCategory,
  loadMoreArticles,
  loadNewerArticles,
} from "@/lib/feed-actions";
import { logout } from "@/lib/auth-actions";
import type { ArticleCardData } from "@/lib/articles-query";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
}

interface Section {
  key: string;
  label: string;
  items: ArticleCardData[];
}

const todayLabel = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Paris",
}).format(new Date());

export function RevueClient({
  initialArticles,
  categories,
  subcategories,
}: {
  initialArticles: ArticleCardData[];
  categories: Category[];
  subcategories: Subcategory[];
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedSubSlug, setSelectedSubSlug] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const [isLoadingMore, startLoadMore] = useTransition();
  const [isSwitching, startSwitch] = useTransition();
  const [hasMore, setHasMore] = useState(initialArticles.length > 0);

  const sourceTags = useMemo(() => {
    const tags = new Set<string>();
    for (const a of articles) {
      if (a.searchTag) tags.add(a.searchTag);
    }
    return Array.from(tags).sort();
  }, [articles]);

  const filtered = useMemo(
    () =>
      selectedSource === null
        ? articles
        : articles.filter((a) => a.searchTag === selectedSource),
    [articles, selectedSource]
  );

  const sections = useMemo<Section[]>(() => {
    if (selectedSlug) {
      const label = categories.find((c) => c.slug === selectedSlug)?.name ?? "";
      return filtered.length ? [{ key: selectedSlug, label, items: filtered }] : [];
    }

    const bySlug = new Map<string, ArticleCardData[]>();
    for (const a of filtered) {
      const key = a.categorySlug ?? "__none__";
      if (!bySlug.has(key)) bySlug.set(key, []);
      bySlug.get(key)!.push(a);
    }

    const ordered: Section[] = [];
    for (const c of categories) {
      const items = bySlug.get(c.slug);
      if (items?.length) ordered.push({ key: c.slug, label: c.name, items });
    }
    const none = bySlug.get("__none__");
    if (none?.length) ordered.push({ key: "__none__", label: "Autres", items: none });
    return ordered;
  }, [filtered, selectedSlug, categories]);

  function handleSelectCategory(slug: string | null) {
    if (slug === selectedSlug) return;
    setSelectedSlug(slug);
    setSelectedSubSlug(null);
    setSelectedSource(null);
    startSwitch(async () => {
      const fresh = await loadArticlesForCategory(slug, null);
      setArticles(fresh);
      setHasMore(fresh.length > 0);
    });
  }

  function handleSelectSubcategory(slug: string | null) {
    if (slug === selectedSubSlug) return;
    setSelectedSubSlug(slug);
    startSwitch(async () => {
      const fresh = await loadArticlesForCategory(selectedSlug, slug);
      setArticles(fresh);
      setHasMore(fresh.length > 0);
    });
  }

  function handleRefresh() {
    setStatus("Actualisation en cours…");
    startRefresh(async () => {
      const result = await refreshFeed();
      setStatus(result.message);
      if (result.newArticles > 0) {
        const fresh = await loadNewerArticles(
          articles[0]?.id ?? 0,
          selectedSlug,
          selectedSubSlug
        );
        setArticles((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          return [...fresh.filter((a) => !existingIds.has(a.id)), ...prev];
        });
      }
    });
  }

  function handleLoadMore() {
    const lastId = articles.at(-1)?.id;
    if (!lastId) return;
    startLoadMore(async () => {
      const more = await loadMoreArticles(lastId, selectedSlug, selectedSubSlug);
      setArticles((prev) => [...prev, ...more]);
      if (more.length === 0) setHasMore(false);
    });
  }

  const currentCategory = categories.find((c) => c.slug === selectedSlug);
  const visibleSubcategories = currentCategory
    ? subcategories.filter((s) => s.categoryId === currentCategory.id)
    : [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col px-4 pb-16 pt-8 sm:px-6">
      <header className="flex flex-col gap-4 border-b border-rule pb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-[30px] font-medium leading-none text-ink sm:text-[34px]">
              Ma Revue de Presse
            </h1>
            <p className="font-body mt-2 text-sm capitalize text-ink-soft">
              {todayLabel}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Link
              href="/settings"
              aria-label="Paramètres"
              className="font-body text-sm text-ink-soft hover:text-ink"
            >
              Réglages
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="font-body text-sm text-ink-soft hover:text-ink"
              >
                Quitter
              </button>
            </form>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-body min-h-[1.25rem] text-sm text-ink-soft">
            {status ?? " "}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="font-body text-sm font-medium text-accent hover:underline disabled:opacity-50"
          >
            {isRefreshing ? "Actualisation…" : "Actualiser"}
          </button>
        </div>
      </header>

      <nav className="flex gap-5 overflow-x-auto pt-4 text-sm">
        <NavButton
          label="Tous"
          active={selectedSlug === null}
          onClick={() => handleSelectCategory(null)}
        />
        {categories.map((c) => (
          <NavButton
            key={c.id}
            label={c.name}
            active={selectedSlug === c.slug}
            onClick={() => handleSelectCategory(c.slug)}
          />
        ))}
      </nav>

      {visibleSubcategories.length > 0 ? (
        <nav className="flex gap-4 overflow-x-auto pb-1 pt-2 text-xs">
          <NavButton
            label="Toutes sous-catégories"
            active={selectedSubSlug === null}
            onClick={() => handleSelectSubcategory(null)}
            muted
          />
          {visibleSubcategories.map((s) => (
            <NavButton
              key={s.id}
              label={s.name}
              active={selectedSubSlug === s.slug}
              onClick={() => handleSelectSubcategory(s.slug)}
              muted
            />
          ))}
        </nav>
      ) : null}

      {sourceTags.length > 0 ? (
        <nav className="flex gap-4 overflow-x-auto pb-1 pt-2 text-xs">
          <NavButton
            label="Toutes recherches"
            active={selectedSource === null}
            onClick={() => setSelectedSource(null)}
            muted
          />
          {sourceTags.map((tag) => (
            <NavButton
              key={tag}
              label={tag}
              active={selectedSource === tag}
              onClick={() => setSelectedSource(tag)}
              muted
            />
          ))}
        </nav>
      ) : null}

      {isSwitching ? (
        <p className="font-body py-16 text-center text-sm text-ink-soft">
          Chargement…
        </p>
      ) : sections.length === 0 ? (
        <p className="font-body py-16 text-center text-sm text-ink-soft">
          Aucun article pour le moment.
        </p>
      ) : (
        sections.map((section) => (
          <section key={section.key} className="pt-8">
            <h2 className="font-display text-sm font-medium uppercase tracking-wide text-ink-soft">
              {section.label}
            </h2>
            <div className="mt-4 columns-1 gap-4 sm:columns-2 lg:columns-3">
              {section.items.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        ))
      )}

      {hasMore && !isSwitching ? (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className="font-body mx-auto mt-8 text-sm font-medium text-accent hover:underline disabled:opacity-50"
        >
          {isLoadingMore ? "Chargement…" : "Charger plus d'articles"}
        </button>
      ) : null}
    </div>
  );
}

function NavButton({
  label,
  active,
  onClick,
  muted,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-body shrink-0 border-b-2 pb-2 transition-colors ${
        muted ? "text-xs" : "text-sm font-medium"
      } ${
        active
          ? "border-accent text-ink"
          : "border-transparent text-ink-soft hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

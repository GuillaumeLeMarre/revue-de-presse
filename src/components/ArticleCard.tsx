import type { ArticleCardData } from "@/lib/articles-query";
import { formatRelativeTime } from "@/lib/format-relative-time";

export function ArticleCard({ article }: { article: ArticleCardData }) {
  const href = article.originalUrl ?? article.feedUrl ?? "#";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      {article.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.imageUrl}
          alt=""
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      ) : null}

      <div className="flex flex-1 flex-col gap-2 p-4">
        {article.categoryName ? (
          <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {article.categoryName}
          </span>
        ) : null}

        <h2 className="text-base font-semibold leading-snug text-gray-900 dark:text-gray-100">
          {article.title}
        </h2>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {[article.source, formatRelativeTime(article.publishedAt)]
            .filter(Boolean)
            .join(" • ")}
        </p>

        {article.summary ? (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {article.summary}
          </p>
        ) : null}

        {article.summarySource === "rss_excerpt" ? (
          <p className="text-xs italic text-gray-400 dark:text-gray-500">
            Résumé basé sur l&apos;extrait disponible
          </p>
        ) : null}

        <span className="mt-auto pt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
          → Lire l&apos;article
        </span>
      </div>
    </a>
  );
}

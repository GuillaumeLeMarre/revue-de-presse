import type { ArticleCardData } from "@/lib/articles-query";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { categoryColor } from "@/lib/category-colors";

export function ArticleCard({ article }: { article: ArticleCardData }) {
  const href = article.originalUrl ?? article.feedUrl ?? "#";
  const color = categoryColor(article.categorySlug);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ borderLeftColor: color }}
      className="group mb-4 block break-inside-avoid overflow-hidden rounded-tl-2xl rounded-tr-2xl rounded-br-md rounded-bl-md border border-l-[3px] border-rule bg-card transition-colors duration-200 hover:border-accent/60"
    >
      {article.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.imageUrl}
          alt=""
          loading="lazy"
          className="w-full object-cover"
        />
      ) : null}

      <div className="flex flex-col gap-2 p-4">
        {article.categoryName ? (
          <span
            style={{ color }}
            className="font-body flex items-center gap-1.5 text-xs font-medium"
          >
            <span
              style={{ backgroundColor: color }}
              className="h-1.5 w-1.5 rounded-full"
            />
            {article.categoryName}
            {article.subcategoryName ? ` · ${article.subcategoryName}` : ""}
          </span>
        ) : null}

        <h2 className="font-display text-lg font-medium leading-snug text-ink group-hover:text-accent">
          {article.title}
        </h2>

        {article.summary ? (
          <p className="font-body line-clamp-3 text-sm leading-relaxed text-ink-soft">
            {article.summary}
          </p>
        ) : null}

        {article.summarySource === "rss_excerpt" ? (
          <p className="font-body text-xs italic text-ink-soft/70">
            Résumé basé sur l&apos;extrait disponible
          </p>
        ) : null}

        <p className="font-body text-[13px] text-ink-soft">
          {[article.source, formatRelativeTime(article.publishedAt)]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </a>
  );
}

import type { ArticleCardData } from "@/lib/articles-query";
import { formatRelativeTime } from "@/lib/format-relative-time";

function Meta({ article }: { article: ArticleCardData }) {
  return (
    <p className="font-body text-[13px] text-ink-soft">
      {[article.source, formatRelativeTime(article.publishedAt)]
        .filter(Boolean)
        .join(" · ")}
      {article.searchTag ? (
        <span className="text-ink-soft"> · {article.searchTag}</span>
      ) : null}
    </p>
  );
}

export function LeadArticle({ article }: { article: ArticleCardData }) {
  const href = article.originalUrl ?? article.feedUrl ?? "#";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 sm:flex-row sm:gap-5"
    >
      {article.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.imageUrl}
          alt=""
          loading="lazy"
          className="h-48 w-full shrink-0 object-cover sm:h-40 sm:w-56"
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-2">
        <h2 className="font-display text-[26px] font-medium leading-[1.15] text-ink group-hover:text-accent sm:text-[28px]">
          {article.title}
        </h2>
        {article.summary ? (
          <p className="font-body text-[15px] leading-relaxed text-ink-soft">
            {article.summary}
          </p>
        ) : null}
        {article.summarySource === "rss_excerpt" ? (
          <p className="font-body text-xs italic text-ink-soft/70">
            Résumé basé sur l&apos;extrait disponible
          </p>
        ) : null}
        <Meta article={article} />
      </div>
    </a>
  );
}

export function RiverItem({ article }: { article: ArticleCardData }) {
  const href = article.originalUrl ?? article.feedUrl ?? "#";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 py-4"
    >
      {article.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.imageUrl}
          alt=""
          loading="lazy"
          className="h-16 w-16 shrink-0 object-cover sm:h-20 sm:w-20"
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-1.5">
        <h3 className="font-display text-lg font-medium leading-snug text-ink group-hover:text-accent">
          {article.title}
        </h3>
        {article.summary ? (
          <p className="font-body line-clamp-2 text-sm leading-relaxed text-ink-soft">
            {article.summary}
          </p>
        ) : null}
        <Meta article={article} />
      </div>
    </a>
  );
}

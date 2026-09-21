import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export interface ExtractedArticle {
  title: string | null;
  byline: string | null;
  publishedAt: Date | null;
  textContent: string;
  imageUrl: string | null;
}

export function extractArticle(
  html: string,
  url: string
): ExtractedArticle | null {
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;

  const ogImage = document
    .querySelector('meta[property="og:image"]')
    ?.getAttribute("content");

  const reader = new Readability(document);
  const parsed = reader.parse();

  if (!parsed || !parsed.textContent) {
    return null;
  }

  return {
    title: parsed.title ?? null,
    byline: parsed.byline ?? null,
    publishedAt: parsed.publishedTime ? new Date(parsed.publishedTime) : null,
    textContent: parsed.textContent.trim(),
    imageUrl: ogImage ?? null,
  };
}

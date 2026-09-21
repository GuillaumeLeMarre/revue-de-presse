import Parser from "rss-parser";

export interface RssItem {
  title: string;
  feedUrl: string;
  guid: string | null;
  description: string | null;
  sourceName: string | null;
  publishedAt: Date | null;
  imageUrl: string | null;
}

interface CustomFeedItem {
  source?: string;
  "media:content"?: { $: { url?: string } };
}

const parser: Parser<unknown, CustomFeedItem> = new Parser({
  customFields: {
    item: ["source", "media:content"],
  },
  timeout: 15000,
  headers: {
    "User-Agent": "MaRevueDePresse/1.0 (+https://rvp.lemarre.online)",
  },
});

export async function fetchRssItems(rssUrl: string): Promise<RssItem[]> {
  const feed = await parser.parseURL(rssUrl);

  return (feed.items ?? []).map((item) => ({
    title: item.title?.trim() ?? "",
    feedUrl: item.link?.trim() ?? "",
    guid: item.guid ?? null,
    description: item.contentSnippet ?? item.content ?? null,
    sourceName: item.source ?? null,
    publishedAt: item.pubDate ? new Date(item.pubDate) : null,
    imageUrl: item["media:content"]?.$.url ?? item.enclosure?.url ?? null,
  }));
}

const GOOGLE_NEWS_HOST = "news.google.com";
const RESOLVE_TIMEOUT_MS = 8000;

/**
 * Best-effort resolution of the publisher URL behind a Google News RSS link.
 * Google News often serves an interstitial rather than a plain HTTP redirect,
 * so this can fail; callers must treat a null result as "unresolved" and fall
 * back to feed_url / RSS excerpt (see PRD §27, §32-33).
 */
export async function resolveOriginalUrl(
  feedUrl: string
): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(feedUrl);
  } catch {
    return null;
  }

  if (url.hostname !== GOOGLE_NEWS_HOST) {
    return feedUrl;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS);

  try {
    const response = await fetch(feedUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "MaRevueDePresse/1.0 (+https://rvp.lemarre.online)",
      },
    });
    const finalHost = new URL(response.url).hostname;
    return finalHost !== GOOGLE_NEWS_HOST ? response.url : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function buildGoogleNewsRssUrl(
  query: string,
  language: string = "fr",
  country: string = "FR"
): string {
  const params = new URLSearchParams({
    q: query,
    hl: `${language}-${country}`,
    gl: country,
    ceid: `${country}:${language}`,
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

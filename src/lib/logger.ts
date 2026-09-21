export type LogEventType =
  | "RSS_FETCH_SUCCESS"
  | "RSS_FETCH_FAILED"
  | "ARTICLE_DISCOVERED"
  | "ARTICLE_DUPLICATE"
  | "ARTICLE_FETCH_SUCCESS"
  | "ARTICLE_FETCH_FAILED"
  | "ARTICLE_EXTRACTION_SUCCESS"
  | "ARTICLE_EXTRACTION_FAILED"
  | "LLM_SUCCESS"
  | "LLM_FAILED";

export function logEvent(
  type: LogEventType,
  data: Record<string, unknown> = {}
): void {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      type,
      ...data,
    })
  );
}

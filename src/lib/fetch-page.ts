const FETCH_TIMEOUT_MS = 15000;
const MAX_REDIRECTS = 5;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const USER_AGENT = "MaRevueDePresseBot/1.0 (+https://rvp.lemarre.online)";

export interface FetchPageResult {
  html: string;
  finalUrl: string;
}

export async function fetchPage(url: string): Promise<FetchPageResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      // @ts-expect-error - undici-specific option, ignored elsewhere
      follow: MAX_REDIRECTS,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) {
      throw new Error(`Unsupported content-type: ${contentType}`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BYTES) {
      throw new Error(`Page too large: ${contentLength} bytes`);
    }

    const buffer = await readLimited(response, MAX_BYTES);
    return { html: buffer, finalUrl: response.url };
  } finally {
    clearTimeout(timeout);
  }
}

async function readLimited(
  response: Response,
  maxBytes: number
): Promise<string> {
  if (!response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        throw new Error(`Page exceeds max size of ${maxBytes} bytes`);
      }
      chunks.push(value);
    }
  }

  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
}

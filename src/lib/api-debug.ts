// Logs failed API requests to the devtools console so operators
// can see request shape (method, url, status, body) without
// digging through the Network tab. Idempotent.
let installed = false;

export function installApiDebug(): void {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  const original = window.fetch.bind(window);

  window.fetch = async function instrumented(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const method = init?.method ?? "GET";
    const url = typeof input === "string" ? input : input.toString();

    try {
      const response = await original(input, init);
      if (response.status >= 400) {
        const raw = await response.clone().text().catch(() => "");
        console.error(
          `[api] ${response.status} ${method} ${url}\n  body: ${preview(raw, response.headers.get("content-type"))}`
        );
      }
      return response;
    } catch (error) {
      console.error(`[api] network error ${method} ${url}`, error);
      throw error;
    }
  };
}

const PREVIEW_LIMIT = 500;

function preview(raw: string, contentType: string | null): string {
  if (raw.length === 0) return "<empty>";
  const truncated =
    raw.length > PREVIEW_LIMIT ? `${raw.slice(0, PREVIEW_LIMIT)}…` : raw;
  if (contentType?.includes("application/json")) {
    try {
      return JSON.stringify(JSON.parse(truncated), null, 2);
    } catch {
      return truncated;
    }
  }
  return truncated;
}
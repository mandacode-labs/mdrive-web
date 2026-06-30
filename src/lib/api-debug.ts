/**
 * Global fetch interceptor for SPA-side request diagnostics.
 *
 * In production, when an API call fails (4xx/5xx, network error) the only
 * signal an operator has is the browser's Network tab. Logging the request
 * shape (method, url, status, body) to `console.error` makes the same
 * information visible in the devtools console without losing the redirect
 * chain context that a deep-linked session might carry.
 *
 * The interceptor is dev/prod-agnostic: MSW and the data API both go
 * through `window.fetch`, so we see both. Failures from MSW (404 path
 * mismatch, missing handler) are just as informative as backend 500s.
 */

let installed = false;

export function installApiDebug(): void {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function instrumentedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const method = init?.method ?? "GET";
    const url = typeof input === "string" ? input : input.toString();

    try {
      const response = await originalFetch(input, init);

      if (response.status >= 400) {
        const contentType = response.headers.get("content-type") ?? "";
        const body =
          contentType.includes("application/json")
            ? await response.clone().text().catch(() => "<unread>")
            : await response
                .clone()
                .text()
                .then((t) => (t.length > 200 ? `${t.slice(0, 200)}…` : t))
                .catch(() => "<unread>");

        console.error(
          `[api] ${response.status} ${method} ${url}`,
          "\n  body:", body
        );
      }

      return response;
    } catch (error) {
      console.error(`[api] network error ${method} ${url}`, error);
      throw error;
    }
  };
}
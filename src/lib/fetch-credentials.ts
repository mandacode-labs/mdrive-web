// Cross-origin direct API calls need credentials: 'include' for the
// session cookie to flow. orval 8.15.0 doesn't expose a config hook
// for this, so we wrap window.fetch once at app boot.
//
// Also defends against non-JSON responses (e.g. an HTML error page
// from a misconfigured CORS preflight) reaching orval's generated
// JSON.parse. The original response status is preserved.
let installed = false;

export function installFetchCredentials(): void {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const res = await original(input, { ...init, credentials: "include" });
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("json")) return res;
    const text = await res.clone().text();
    if (!text || (!text.startsWith("{") && !text.startsWith("["))) {
      return new Response("{}", {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
    }
    return res;
  };
}
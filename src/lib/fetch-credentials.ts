// Cross-origin direct API calls need credentials: 'include' for the
// session cookie to flow. orval 8.15.0 doesn't expose a config hook
// for this, so we wrap window.fetch once at app boot. Idempotent.
let installed = false;

export function installFetchCredentials(): void {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  const original = window.fetch.bind(window);
  window.fetch = (input, init) =>
    original(input, { ...init, credentials: "include" });
}
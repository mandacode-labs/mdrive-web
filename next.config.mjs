/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    // Backend auth origin. The auth flow (login, logout) bypasses the
    // /api/* rewrite so that Set-Cookie's Domain attribute is set against
    // the actual response origin (api.mdrive.mandacode.com), not the SPA
    // domain. Override per environment in .env.production if needed.
    NEXT_PUBLIC_AUTH_BASE: "https://api.mdrive.mandacode.com",
    // SPA origin. Used to build absolute `redirect_uri` values for the
    // auth flow. The backend validates these against an allowlist.
    NEXT_PUBLIC_SPA_ORIGIN: "https://mdrive.mandacode.com",
  },
  async rewrites() {
    // Skip rewrites in development to allow MSW to intercept requests
    if (process.env.NODE_ENV === "development") {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: "https://api.mdrive.mandacode.com/:path*",
      },
    ];
  },
};

export default nextConfig;
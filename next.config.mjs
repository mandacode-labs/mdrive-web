/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_BASE: "https://api.mdrive.mandacode.com",
  },
};

export default nextConfig;

"use client";

import { useEffect } from "react";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE ?? "";
const SPA_ORIGIN =
  process.env.NEXT_PUBLIC_SPA_ORIGIN ?? "https://mdrive.mandacode.com";

function authUrl(path: string): string {
  if (!AUTH_BASE) return `/api${path}`;
  return `${AUTH_BASE}${path}`;
}

function redirectToAbsolute(redirectTo: string): string {
  return new URL(redirectTo, SPA_ORIGIN).toString();
}

export default function LoginPage() {
  useEffect(() => {
    const url = new URL(authUrl("/auth/login"));
    url.searchParams.set("redirect_uri", redirectToAbsolute("/"));
    window.location.href = url.toString();
  }, []);

  return (
    <div className="flex-center full-size">
      <p>Redirecting...</p>
    </div>
  );
}
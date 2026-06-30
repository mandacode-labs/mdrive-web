"use client";

import { useEffect } from "react";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE ?? "";

function authUrl(path: string): string {
  if (!AUTH_BASE) return `/api${path}`;
  return `${AUTH_BASE}${path}`;
}

export default function LoginPage() {
  useEffect(() => {
    window.location.href = authUrl("/auth/login");
  }, []);

  return (
    <div className="flex-center full-size">
      <p>Redirecting...</p>
    </div>
  );
}
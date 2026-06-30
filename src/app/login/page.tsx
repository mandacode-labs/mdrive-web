"use client";

import { useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export default function LoginPage() {
  useEffect(() => {
    const url = new URL(API_BASE ? `${API_BASE}/auth/login` : "/auth/login");
    url.searchParams.set(
      "redirect_uri",
      new URL("/", window.location.origin).toString()
    );
    window.location.href = url.toString();
  }, []);

  return (
    <div className="flex-center full-size">
      <p>Redirecting...</p>
    </div>
  );
}


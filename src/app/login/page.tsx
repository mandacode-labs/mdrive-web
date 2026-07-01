"use client";

import { useEffect } from "react";

const API_BASE = "https://api.mdrive.mandacode.com";

export default function LoginPage() {
  useEffect(() => {
    const url = new URL(`${API_BASE}/auth/login`);
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
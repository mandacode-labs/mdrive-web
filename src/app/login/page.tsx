"use client";

import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    window.location.href = "/api/auth/google";
  }, []);

  return (
    <div className="flex-center full-size">
      <p>Redirecting to login...</p>
    </div>
  );
}
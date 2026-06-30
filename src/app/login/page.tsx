"use client";

import { useEffect } from "react";

// Backend middleware handles the Zitadel login flow. Hitting `/` while
// unauthenticated triggers a redirect to Zitadel and back.
export default function LoginPage() {
  useEffect(() => {
    window.location.href = "/";
  }, []);

  return (
    <div className="flex-center full-size">
      <p>Redirecting...</p>
    </div>
  );
}
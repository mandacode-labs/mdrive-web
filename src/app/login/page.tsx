"use client";

import { useEffect } from "react";
import { getAuthLoginUrl } from "@/api/generated";

// Sends the browser to the backend's OIDC login entry point. The backend's
// AuthPassthrough middleware then runs the Zitadel choreography and
// redirects back with the session cookie.
export default function LoginPage() {
  useEffect(() => {
    window.location.href = getAuthLoginUrl();
  }, []);

  return (
    <div className="flex-center full-size">
      <p>Redirecting...</p>
    </div>
  );
}
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to reporting service if needed
    void error;
  }, [error]);

  return (
    <div className="flex-center full-size">
      <div className="error-container">
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()} type="button">
          Try again
        </button>
      </div>
    </div>
  );
}

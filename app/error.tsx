"use client";

import posthog from "posthog-js";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  posthog.captureException(error);

  const handleReset = () => {
    posthog.capture("page_error_reset");
    reset();
  };

  return (
    <main className="mx-auto grid min-h-[60vh] w-[min(calc(100%-32px),760px)] place-items-center py-16 text-center">
      <div>
        <p className="text-xs font-semibold tracking-wider text-secondary uppercase">
          Unable to load stories
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-secondary">
          Please try loading the page again.
        </p>
        <button
          className="mt-6 min-h-11 rounded-md bg-foreground px-5 text-sm font-semibold text-white"
          onClick={handleReset}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

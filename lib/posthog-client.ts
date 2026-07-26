"use client";

import posthog from "posthog-js/dist/module.full";

export const isPostHogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
);

export { posthog };

"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

import {
  isPostHogConfigured,
  posthog,
} from "@/lib/posthog-client";

export function PostHogUserIdentity() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isPostHogConfigured) return;
    if (isSignedIn && user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? undefined,
      });
    } else {
      posthog.reset();
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}

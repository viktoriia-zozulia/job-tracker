"use client";

import { useLinkStatus } from "next/link";

/** Shows a thin bar at the top of the page while its parent <Link> is navigating. */
export function LinkPending() {
  const { pending } = useLinkStatus();

  if (!pending) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className="link-pending fixed inset-x-0 top-0 z-50 h-0.5 bg-foreground"
    />
  );
}

"use client";

import { useEffect, useState } from "react";

const SLOW_AFTER_MS = 20_000;

export const SLOW_ACTION_MESSAGE =
  "This is taking longer than it should, and it may not have saved. Reload the page and check before trying again.";

/**
 * True once a pending action has run for too long. The server's database limit
 * normally ends it sooner, so this covers requests that never return.
 *
 * A plain timer is deliberate. React holds back updates from a pending action, so
 * this is the only kind of update that can reach the screen while it's stuck.
 */
export function useSlowPending(pending: boolean) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!pending) {
      return;
    }
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [pending]);

  return slow;
}

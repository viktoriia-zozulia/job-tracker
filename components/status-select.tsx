"use client";

import { useOptimistic, useState, useTransition } from "react";

import { changeApplicationStatus } from "@/lib/actions/applications";
import { localDateString } from "@/lib/dates";
import { SLOW_ACTION_MESSAGE, useSlowPending } from "@/lib/use-slow-pending";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/validation";

export function StatusSelect({
  id,
  company,
  status,
}: {
  id: string;
  company: string;
  status: ApplicationStatus;
}) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const slow = useSlowPending(pending);
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: ApplicationStatus) {
    setError(null);
    startTransition(async () => {
      // Shows right away, and goes back on its own if the status prop doesn't change.
      setOptimisticStatus(next);
      try {
        const result = await changeApplicationStatus(
          id,
          next,
          localDateString(),
        );
        if (result.error) {
          setError(result.error);
        }
      } catch {
        setError("Couldn't change the status. Please try again.");
      }
    });
  }

  return (
    <>
      <select
        aria-label={`Status of ${company}`}
        value={optimisticStatus}
        onChange={(event) =>
          handleChange(event.target.value as ApplicationStatus)
        }
        className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm capitalize dark:border-zinc-700 dark:bg-zinc-900"
      >
        {APPLICATION_STATUSES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {(error || slow) && (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {slow ? SLOW_ACTION_MESSAGE : error}
        </p>
      )}
    </>
  );
}

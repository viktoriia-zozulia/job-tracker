"use client";

import { useRef, useState, useTransition } from "react";

import { deleteApplication } from "@/lib/actions/applications";

export function DeleteApplicationButton({
  id,
  company,
}: {
  id: string;
  company: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteApplication(id);
        if (result.error) {
          setError(result.error);
        }
        // On success the row disappears, and this dialog goes with it.
      } catch {
        setError("Couldn't delete this application. Please try again.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={`Delete ${company}`}
        className="ml-3 text-red-600 underline dark:text-red-400"
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-${id}-title`}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-md bg-background p-6 whitespace-normal text-foreground backdrop:bg-black/40"
      >
        <h2 id={`delete-${id}-title`} className="text-lg font-semibold">
          Delete {company}?
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This permanently removes the application. You can&apos;t undo this.
        </p>
        {error && (
          <p
            role="alert"
            className="mt-2 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={pending}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-60 dark:border-zinc-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={pending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </dialog>
    </>
  );
}

"use client";

export function RouteError({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p role="alert" className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        We couldn&apos;t load this page. Your data is safe, so please try again.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Try again
      </button>
    </main>
  );
}

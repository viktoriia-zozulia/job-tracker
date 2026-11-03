import Link from "next/link";

const boxClass =
  "mt-6 rounded-md border border-dashed border-zinc-300 px-4 py-10 text-center dark:border-zinc-700";

export function NoApplications() {
  return (
    <div className={boxClass}>
      <h2 className="font-medium">No applications yet</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Add your first application to start tracking your search.
      </p>
      <Link
        href="/applications/new"
        className="mt-4 inline-block text-sm font-medium underline"
      >
        Add an application
      </Link>
    </div>
  );
}

export function NoMatches() {
  return (
    <div className={boxClass}>
      <h2 className="font-medium">Nothing matches</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        None of your applications match this filter.
      </p>
      <Link
        href="/dashboard"
        className="mt-4 inline-block text-sm font-medium underline"
      >
        Show all applications
      </Link>
    </div>
  );
}

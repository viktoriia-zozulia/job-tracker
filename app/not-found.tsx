import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/dashboard"
        className="mt-4 inline-block text-sm font-medium underline"
      >
        Back to dashboard
      </Link>
    </main>
  );
}

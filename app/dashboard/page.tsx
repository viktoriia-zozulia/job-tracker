import Link from "next/link";

import { ApplicationsTable } from "@/components/applications-table";
import { NoApplications, NoMatches } from "@/components/empty-state";
import { LogoutButton } from "@/components/logout-button";
import { StatusFilter } from "@/components/status-filter";
import { requireUser } from "@/lib/auth";
import { countApplications, listApplications } from "@/lib/db/queries";
import { parseStatusFilter } from "@/lib/validation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const user = await requireUser();
  const status = parseStatusFilter((await searchParams).status);
  const applications = await listApplications(user.id, { status });
  // Only needed to tell "nothing yet" from "nothing matches this filter".
  const hasAny =
    applications.length > 0 || (await countApplications(user.id)) > 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/applications/new"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Add application
          </Link>
          <LogoutButton />
        </div>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Logged in as {user.email}
      </p>
      {hasAny ? (
        <>
          <StatusFilter active={status} />
          {applications.length > 0 ? (
            <ApplicationsTable applications={applications} />
          ) : (
            <NoMatches />
          )}
        </>
      ) : (
        <NoApplications />
      )}
    </main>
  );
}

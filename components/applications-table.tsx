import Link from "next/link";

import type { Application } from "@/lib/db/queries";
import { normalizeUrl } from "@/lib/validation";

const headerClass = "px-3 py-2 text-left font-medium whitespace-nowrap";
const cellClass = "px-3 py-2 align-top";

function RoleCell({ application }: { application: Application }) {
  // Rows can also be written through the Supabase API, so check the link again before rendering it.
  const href = application.url ? normalizeUrl(application.url) : null;

  if (!href) {
    return application.role;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline"
    >
      {application.role}
    </a>
  );
}

export function ApplicationsTable({
  applications,
}: {
  applications: Application[];
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[48rem] text-sm">
        <thead className="border-b border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th scope="col" className={headerClass}>
              Company
            </th>
            <th scope="col" className={headerClass}>
              Role
            </th>
            <th scope="col" className={headerClass}>
              Status
            </th>
            <th scope="col" className={headerClass}>
              Applied
            </th>
            <th scope="col" className={headerClass}>
              Stack
            </th>
            <th scope="col" className={headerClass}>
              Salary
            </th>
            <th scope="col" className={headerClass}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {applications.map((application) => (
            <tr key={application.id}>
              <td className={`${cellClass} font-medium`}>
                {application.company}
              </td>
              <td className={cellClass}>
                <RoleCell application={application} />
              </td>
              <td className={`${cellClass} capitalize`}>
                {application.status}
              </td>
              <td className={`${cellClass} whitespace-nowrap`}>
                {application.appliedAt}
              </td>
              <td className={cellClass}>
                <ul className="flex flex-wrap gap-1">
                  {application.stack.map((tag) => (
                    <li
                      key={tag}
                      className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </td>
              <td className={cellClass}>{application.salary}</td>
              <td className={`${cellClass} whitespace-nowrap`}>
                <Link
                  href={`/applications/${application.id}/edit`}
                  // Each request to this page runs a lookup in proxy.ts.
                  prefetch={false}
                  aria-label={`Edit ${application.company}`}
                  className="underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import Link from "next/link";

import { LinkPending } from "@/components/link-pending";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/validation";

const OPTIONS = [undefined, ...APPLICATION_STATUSES];

export function StatusFilter({ active }: { active?: ApplicationStatus }) {
  return (
    <nav aria-label="Filter by status" className="mt-6">
      <ul className="flex flex-wrap gap-2">
        {OPTIONS.map((status) => {
          const isActive = status === active;
          return (
            <li key={status ?? "all"}>
              <Link
                href={status ? `/dashboard?status=${status}` : "/dashboard"}
                aria-current={isActive ? "true" : undefined}
                className={`inline-block rounded-full border px-3 py-1 text-sm capitalize ${
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-zinc-300 dark:border-zinc-700"
                }`}
              >
                {status ?? "All"}
                <LinkPending />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

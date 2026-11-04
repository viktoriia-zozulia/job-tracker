import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { aiUsage, applications } from "@/lib/db/schema";
import { appliedDateAfterStatusChange } from "@/lib/dates";
import type { ApplicationInput, ApplicationStatus } from "@/lib/validation";

export type Application = typeof applications.$inferSelect;

const QUERY_TIMEOUT_MS = 10_000;

/** Fails a query that doesn't finish in time, so a stuck database gives an error instead of an endless wait. */
async function withQueryTimeout<T>(query: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("The database query timed out.")),
      QUERY_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([query, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function listApplications(
  userId: string,
  filters: { status?: ApplicationStatus } = {},
): Promise<Application[]> {
  return withQueryTimeout(
    db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          filters.status ? eq(applications.status, filters.status) : undefined,
        ),
      )
      .orderBy(desc(applications.createdAt), desc(applications.id)),
  );
}

export async function countApplications(userId: string) {
  return withQueryTimeout(
    db.$count(applications, eq(applications.userId, userId)),
  );
}

export async function createApplication(
  userId: string,
  input: ApplicationInput,
) {
  await withQueryTimeout(db.insert(applications).values({ ...input, userId }));
}

export async function getApplication(
  userId: string,
  id: string,
): Promise<Application | null> {
  const [application] = await withQueryTimeout(
    db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId))),
  );
  return application ?? null;
}

/** Returns false if no application with this id belongs to this user. */
export async function updateApplication(
  userId: string,
  id: string,
  input: ApplicationInput,
) {
  const updated = await withQueryTimeout(
    db
      .update(applications)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning({ id: applications.id }),
  );
  return updated.length > 0;
}

/** Changes only the status, applying the applied date rule. Returns false if no application with this id belongs to this user. */
export async function updateApplicationStatus(
  userId: string,
  id: string,
  status: ApplicationStatus,
  today: string,
) {
  const existing = await getApplication(userId, id);
  if (!existing) {
    return false;
  }

  const updated = await withQueryTimeout(
    db
      .update(applications)
      .set({
        status,
        appliedAt: appliedDateAfterStatusChange(
          { from: existing.status, to: status, appliedAt: existing.appliedAt },
          today,
        ),
        updatedAt: new Date(),
      })
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning({ id: applications.id }),
  );
  return updated.length > 0;
}

/** Returns false if no application with this id belongs to this user. */
export async function deleteApplication(userId: string, id: string) {
  const deleted = await withQueryTimeout(
    db
      .delete(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning({ id: applications.id }),
  );
  return deleted.length > 0;
}

/**
 * Claims one AI parse for this user today (UTC). Returns false at the limit.
 * One atomic statement, so parallel requests can't go over the limit.
 */
export async function claimAiUse(userId: string, dailyLimit: number) {
  const day = new Date().toISOString().slice(0, 10);
  const claimed = await withQueryTimeout(
    db
      .insert(aiUsage)
      .values({ userId, day, count: 1 })
      .onConflictDoUpdate({
        target: [aiUsage.userId, aiUsage.day],
        set: { count: sql`${aiUsage.count} + 1` },
        where: sql`${aiUsage.count} < ${dailyLimit}`,
      })
      .returning({ count: aiUsage.count }),
  );
  return claimed.length > 0;
}

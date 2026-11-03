import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { appliedDateAfterStatusChange } from "@/lib/dates";
import type { ApplicationInput, ApplicationStatus } from "@/lib/validation";

export type Application = typeof applications.$inferSelect;

export async function listApplications(
  userId: string,
  filters: { status?: ApplicationStatus } = {},
): Promise<Application[]> {
  return db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.userId, userId),
        filters.status ? eq(applications.status, filters.status) : undefined,
      ),
    )
    .orderBy(desc(applications.createdAt), desc(applications.id));
}

export async function countApplications(userId: string) {
  return db.$count(applications, eq(applications.userId, userId));
}

export async function createApplication(
  userId: string,
  input: ApplicationInput,
) {
  await db.insert(applications).values({ ...input, userId });
}

export async function getApplication(
  userId: string,
  id: string,
): Promise<Application | null> {
  const [application] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)));
  return application ?? null;
}

/** Returns false if no application with this id belongs to this user. */
export async function updateApplication(
  userId: string,
  id: string,
  input: ApplicationInput,
) {
  const updated = await db
    .update(applications)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning({ id: applications.id });
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

  const updated = await db
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
    .returning({ id: applications.id });
  return updated.length > 0;
}

/** Returns false if no application with this id belongs to this user. */
export async function deleteApplication(userId: string, id: string) {
  const deleted = await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .returning({ id: applications.id });
  return deleted.length > 0;
}

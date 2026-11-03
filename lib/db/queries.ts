import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
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

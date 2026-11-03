import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import type { ApplicationInput } from "@/lib/validation";

export type Application = typeof applications.$inferSelect;

export async function listApplications(userId: string): Promise<Application[]> {
  return db
    .select()
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt), desc(applications.id));
}

export async function createApplication(
  userId: string,
  input: ApplicationInput,
) {
  await db.insert(applications).values({ ...input, userId });
}

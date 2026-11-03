import "server-only";

import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import type { ApplicationInput } from "@/lib/validation";

export async function createApplication(
  userId: string,
  input: ApplicationInput,
) {
  await db.insert(applications).values({ ...input, userId });
}

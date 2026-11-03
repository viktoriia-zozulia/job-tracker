import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Supabase's transaction pooler doesn't support prepared statements.
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  idle_timeout: 20,
});

export const db = drizzle({ client });

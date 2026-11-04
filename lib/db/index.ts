import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {
  // The driver doesn't encrypt unless told to.
  ssl: "require",
  // Supabase's transaction pooler doesn't support prepared statements.
  prepare: false,
  // Through this pooler, parallel queries hang when the driver pipelines them
  // on one connection. This makes extra queries wait for a free connection.
  max_pipeline: 1,
  idle_timeout: 20,
});

export const db = drizzle({ client });

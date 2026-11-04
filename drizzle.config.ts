import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local", quiet: true });

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // The driver doesn't encrypt unless told to.
    url: `${process.env.DATABASE_URL!}?sslmode=require`,
  },
});

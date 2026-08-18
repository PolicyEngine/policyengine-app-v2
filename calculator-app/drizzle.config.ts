import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    // Only needed for push/migrate/studio; `generate` works without it.
    url: process.env.DATABASE_URL ?? "",
  },
});

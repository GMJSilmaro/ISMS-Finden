import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Local: .env.local. Docker / CI: container or shell env (and optional .env).
config({ path: ".env.local" });
config({ path: ".env" });

/**
 * `prisma generate` must work without a live DB (postinstall, Docker build, CI).
 * Migrate/seed still need a real DIRECT_URL at runtime.
 */
function datasourceUrl(): string {
  return (
    process.env.DIRECT_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "postgresql://isms:isms@127.0.0.1:5432/isms"
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // CLI migrations use direct connection (app runtime uses DATABASE_URL via adapter).
    url: datasourceUrl(),
  },
});

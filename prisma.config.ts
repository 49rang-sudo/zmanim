import { defineConfig, env } from "prisma/config";

// Prisma 7 לא טוען .env בעצמו יותר. Node טוען אותו בשבילנו.
try {
  process.loadEnvFile();
} catch {
  // אין קובץ .env — מסתמכים על משתני סביבה אמיתיים (Docker / CI)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
});

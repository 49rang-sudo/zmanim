/**
 * הוספת מנהלות חד-פעמית — בקשה מפורשת: "תן לי גישה לאדמין מ2 הכתובות
 * מייל שנתתי לך". כניסה דרך Google בלבד, בלי סיסמה (תואם למודל
 * AdminUser הקיים — ראו prisma/schema.prisma).
 *
 * הרצה:  npx tsx scripts/add-admins.ts
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

process.loadEnvFile?.();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const EMAILS = ["brachanadav@zmanim1288.com", "zmanim678@gmail.com"];

async function main() {
  for (const raw of EMAILS) {
    const email = raw.toLowerCase().trim();
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      console.log(`· ${email} כבר קיים/ת (role: ${existing.role})`);
      continue;
    }
    const created = await prisma.adminUser.create({
      data: { email, name: "מנהל/ת הלוח", role: "ADMIN" },
    });
    console.log(`✓ נוצר/ה: ${created.email} (role: ${created.role})`);
  }
}

main()
  .catch((error) => {
    console.error("נכשל:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

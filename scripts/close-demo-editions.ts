/**
 * סגירת מהדורות דמו — משאירה פתוחה רק את המהדורות של בני ברק,
 * סוגרת (status=CLOSED) את כל שאר הערים (ירושלים/אלעד/צפת וכו').
 *
 * בקשה מפורשת של בעלת האתר: "תסגור את כל המהדורות האחרות. זה נתוני דמה" —
 * השנה יש בפועל רק מהדורה אחת אמיתית (בני ברק); שאר הערים הן דאטה
 * לדוגמה שנשארה פתוחה בטעות ומטעה לקוחות (מציגה 4 ערים לבחירה).
 *
 * לא נוגע ב-Order/SlotReservation קיימים בערים האחרות (אם יש) — רק
 * ב-status של ה-Edition עצמה, כדי שלא תוצע להזמנה חדשה.
 *
 * הרצה:  npx tsx scripts/close-demo-editions.ts
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

process.loadEnvFile?.();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const KEEP_OPEN_CITY_NAME = "בני ברק";

async function main() {
  const keepCity = await prisma.city.findFirst({ where: { name: KEEP_OPEN_CITY_NAME } });
  if (!keepCity) {
    throw new Error(`לא נמצאה עיר בשם "${KEEP_OPEN_CITY_NAME}" — עוצר בלי לשנות כלום.`);
  }

  const toClose = await prisma.edition.findMany({
    where: { status: "OPEN", cityId: { not: keepCity.id } },
    include: { city: true },
  });

  console.log(`עיר שנשארת פתוחה: ${keepCity.name} (${keepCity.id})`);
  console.log(`נמצאו ${toClose.length} מהדורות פתוחות בערים אחרות לסגירה:`);
  for (const e of toClose) {
    console.log(`  · ${e.city.name} — ${e.hebrewLabel} (${e.gregorianMonth}/${e.gregorianYear})`);
  }

  if (toClose.length === 0) {
    console.log("אין מה לסגור.");
    return;
  }

  const result = await prisma.edition.updateMany({
    where: { status: "OPEN", cityId: { not: keepCity.id } },
    data: { status: "CLOSED" },
  });

  console.log(`הושלם: ${result.count} מהדורות נסגרו.`);
}

main()
  .catch((error) => {
    console.error("נכשל:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

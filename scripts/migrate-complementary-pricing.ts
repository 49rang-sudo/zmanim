/**
 * מיגרציית מחיר חד-פעמית: משלים עובר מ"פר-חלון" (1200–1350 ₪,
 * ערכים שונים בכל Hotspot/AdSlot) לבסיס אחיד — 1,400 ₪ — בדיוק
 * כמו שהעוגן כבר עובד היום (1,600 ₪ קבוע, עם סולם ההנחות היחסי
 * שב-src/lib/packages.ts).
 *
 * ⚠ לא רצה אוטומטית — סקריפט זה כותב למסד הנתונים (Hotspot.priceAgorot
 * ו-AdSlot.priceAgorot לכל חלון/משבצת ברמת COMPLEMENTARY). יש להריץ
 * ידנית, אחרי סקירה, ולא כחלק מהפריסה:
 *   npx tsx scripts/migrate-complementary-pricing.ts
 *
 * מה הוא עושה:
 *  1. מוצא את כל ה-Hotspot שדרגתם COMPLEMENTARY ומחירם שונה מ-140,000.
 *  2. מעדכן את Hotspot.priceAgorot ל-140,000 (שדה אפיון/ברירת מחדל
 *     בלבד — ראו ההערה בסכמה).
 *  3. מעדכן את ה-AdSlot המקושר (hotspotId) ל-priceAgorot = 140,000 —
 *     זה מקור האמת האמיתי לכסף שנגבה בהזמנות *חדשות*.
 *
 * מה הוא *לא* עושה, בכוונה:
 *  · לא נוגע ב-Order קיים: Order.priceAgorot משוכפל בזמן היצירה
 *    (ראו ההערה בסכמה — "שינוי מחירון לא משנה הזמנות עבר"), ולכן
 *    הזמנות ששולמו כבר נשארות בדיוק כפי שהיו, כמו שצריך.
 *  · לא נוגע במשבצות הרשת הישנה (AdSlot בלי hotspotId) — אלו לא
 *    נושאות דרגה (tier) בכלל, ואין דרך למפות אותן ל-COMPLEMENTARY.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

process.loadEnvFile?.();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const NEW_PRICE_AGOROT = 140_000;

async function main() {
  const hotspots = await prisma.hotspot.findMany({
    where: { tier: "COMPLEMENTARY" },
    include: { slot: true },
  });

  const toChange = hotspots.filter((h) => h.priceAgorot !== NEW_PRICE_AGOROT);

  console.log(
    `נמצאו ${hotspots.length} חלונות משלים, ${toChange.length} מהם דורשים עדכון מחיר.`,
  );

  if (toChange.length === 0) {
    console.log("אין מה לעדכן.");
    return;
  }

  for (const hotspot of toChange) {
    await prisma.$transaction(async (tx) => {
      await tx.hotspot.update({
        where: { id: hotspot.id },
        data: { priceAgorot: NEW_PRICE_AGOROT },
      });

      if (hotspot.slot) {
        await tx.adSlot.update({
          where: { id: hotspot.slot.id },
          data: { priceAgorot: NEW_PRICE_AGOROT },
        });
      }
    });

    console.log(
      `עודכן: Hotspot ${hotspot.id} (${hotspot.category}) ${hotspot.priceAgorot} → ${NEW_PRICE_AGOROT}` +
        (hotspot.slot
          ? ` · AdSlot ${hotspot.slot.sku} ${hotspot.slot.priceAgorot} → ${NEW_PRICE_AGOROT}`
          : " · (בלי AdSlot מקושר)"),
    );
  }

  console.log(`הושלם: ${toChange.length} חלונות עודכנו ל-₪1,400.`);
}

main()
  .catch((error) => {
    console.error("נכשל:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

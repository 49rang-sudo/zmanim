/**
 * מסנכרן את תוכן האתר במסד עם ברירת המחדל שבקוד.
 * הרצה:  npm run content:sync
 *
 * שימושי אחרי עדכון קופי בקוד — הזריעה הרגילה לא דורסת תוכן
 * קיים בכוונה, ולכן צריך פעולה מפורשת.
 *
 * המותג ופרטי הקשר נשמרים כפי שהם, כדי שלא נדרוס לוגו ושם
 * שהמנהלת כבר הגדירה בלוח הניהול.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { defaultContent, type SiteContentData } from "../src/lib/content";

process.loadEnvFile?.();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const row = await prisma.siteContent.findUnique({
    where: { id: "singleton" },
  });

  const current = row?.data as Partial<SiteContentData> | undefined;

  const next: SiteContentData = {
    ...defaultContent,
    brand: current?.brand ?? defaultContent.brand,
    contact: current?.contact ?? defaultContent.contact,
  };

  await prisma.siteContent.upsert({
    where: { id: "singleton" },
    update: { data: next },
    create: { id: "singleton", data: next },
  });

  console.log("תוכן האתר סונכרן.");
  console.log(`  מותג:   ${next.brand.siteName}`);
  console.log(`  כותרת:  ${next.hero.title}`);
  console.log(`  חסות:   ${next.calendar.footnote}`);
}

main()
  .catch((error) => {
    console.error("הסנכרון נכשל:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

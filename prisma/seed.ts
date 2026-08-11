/**
 * זריעת נתונים ראשונית.
 * הרצה:  npm run db:seed
 *
 * הסקריפט אידמפוטנטי — אפשר להריץ אותו שוב בלי לשכפל נתונים.
 * הזמנות קיימות לעולם לא נמחקות.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { defaultContent } from "../src/lib/content";
import { slugify } from "../src/lib/utils";

process.loadEnvFile?.();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// ---------------------------------------------------------------
//  פריסת העמוד המודפס — רשת 6 עמודות × 4 שורות
//  (עמודה 1 היא הימנית ביותר, כי העמוד עברי)
// ---------------------------------------------------------------
// הגיליון הוא A4 מקופל. החצי העליון — אזור המפרסמים — הוא A5:
// 21 × 14.85 ס"מ. עם שוליים 1 ס"מ ומרווח 0.3 ס"מ בין משבצות,
// השטח השימושי הוא 19 × 12.85, כלומר עמודה 2.9 ושורה 3.0 ס"מ.
const SLOTS = [
  {
    sku: "LU-TOP-STRIP",
    name: "רצועה עליונה",
    description: "הרוחב המלא בראש האזור.",
    col: 1, row: 1, colSpan: 6, rowSpan: 1,
    widthCm: 19, heightCm: 3,
    priceAgorot: 240_000,
  },
  {
    sku: "LU-BLOCK-A",
    name: "משבצת כפולה",
    description: "פי ארבעה משטח של משבצת רגילה.",
    col: 1, row: 2, colSpan: 2, rowSpan: 2,
    widthCm: 6.1, heightCm: 6.3,
    priceAgorot: 150_000,
  },
  { sku: "LU-SQ-01", col: 3, row: 2 },
  { sku: "LU-SQ-02", col: 4, row: 2 },
  { sku: "LU-SQ-03", col: 5, row: 2 },
  { sku: "LU-SQ-04", col: 6, row: 2 },
  {
    sku: "LU-WIDE-01",
    name: "משבצת רחבה",
    description: "רוחב כפול — מתאימה ללוגו עם שורת מסר.",
    col: 3, row: 3, colSpan: 2, rowSpan: 1,
    widthCm: 6.1, heightCm: 3,
    priceAgorot: 80_000,
  },
  { sku: "LU-SQ-05", col: 5, row: 3 },
  { sku: "LU-SQ-06", col: 6, row: 3 },
  { sku: "LU-SQ-07", col: 1, row: 4 },
  { sku: "LU-SQ-08", col: 2, row: 4 },
  { sku: "LU-SQ-09", col: 3, row: 4 },
  { sku: "LU-SQ-10", col: 4, row: 4 },
  {
    sku: "LU-WIDE-02",
    name: "משבצת רחבה",
    description: "רוחב כפול בשורה התחתונה, צמוד ללוח עצמו.",
    col: 5, row: 4, colSpan: 2, rowSpan: 1,
    widthCm: 6.1, heightCm: 3,
    priceAgorot: 80_000,
  },
];

// ברירות מחדל למשבצת רגילה
const SQUARE_DEFAULTS = {
  name: "משבצת",
  description: "המידה הסטנדרטית של הלוח.",
  colSpan: 1,
  rowSpan: 1,
  widthCm: 2.9,
  heightCm: 3,
  priceAgorot: 45_000,
  badge: null as string | null,
};

const CITIES = [
  { name: "ירושלים", region: "ירושלים והסביבה", capacity: 14, distribution: 12_000 },
  { name: "בני ברק", region: "גוש דן", capacity: 14, distribution: 9_500 },
  { name: "אשדוד", region: "דרום", capacity: 14, distribution: 7_000 },
  { name: "בית שמש", region: "ירושלים והסביבה", capacity: 14, distribution: 6_500 },
  { name: "מודיעין עילית", region: "ירושלים והסביבה", capacity: 12, distribution: 5_800 },
  { name: "ביתר עילית", region: "ירושלים והסביבה", capacity: 12, distribution: 5_200 },
  { name: "אלעד", region: "מרכז", capacity: 10, distribution: 4_400 },
  { name: "פתח תקווה", region: "מרכז", capacity: 14, distribution: 8_000 },
  { name: "נתניה", region: "שרון", capacity: 12, distribution: 6_000 },
  { name: "רחובות", region: "מרכז", capacity: 10, distribution: 4_800 },
  { name: "צפת", region: "צפון", capacity: 10, distribution: 3_500 },
  { name: "אופקים", region: "דרום", capacity: 10, distribution: 3_200 },
];

async function main() {
  console.log("→ זריעת מסד הנתונים…");

  // --- תוכן האתר -----------------------------------------------
  await prisma.siteContent.upsert({
    where: { id: "singleton" },
    // תוכן קיים לא נדרס — עריכות של המנהלת שורדות זריעה חוזרת
    update: {},
    create: {
      id: "singleton",
      landingEnabled: true,
      tosVersion: "1.0",
      data: defaultContent,
    },
  });
  console.log("  ✓ תוכן האתר");

  // --- משתמש ניהול ------------------------------------------------
  // כניסה דרך Google בלבד — אין סיסמה. המייל הזה הופך ל-OWNER הראשון,
  // מורשה יחיד להוסיף מיילי אדמין נוספים דרך לוח הניהול (טאב "צוות").
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@luach.local")
    .toLowerCase()
    .trim();

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email } });

  if (existingAdmin) {
    console.log(`  · משתמש ניהול ${email} כבר קיים`);
  } else {
    await prisma.adminUser.create({
      data: {
        email,
        name: "מנהל/ת הלוח",
        role: "OWNER",
      },
    });
    console.log(`  ✓ משתמש ניהול נוצר (OWNER): ${email}`);
  }

  // --- משבצות ---------------------------------------------------
  let slotIndex = 0;
  for (const raw of SLOTS) {
    const slot = { ...SQUARE_DEFAULTS, ...raw };
    await prisma.adSlot.upsert({
      where: { sku: slot.sku },
      update: {
        col: slot.col,
        row: slot.row,
        colSpan: slot.colSpan,
        rowSpan: slot.rowSpan,
        widthCm: slot.widthCm,
        heightCm: slot.heightCm,
        sortOrder: slotIndex,
      },
      create: {
        sku: slot.sku,
        name: slot.name,
        description: slot.description,
        col: slot.col,
        row: slot.row,
        colSpan: slot.colSpan,
        rowSpan: slot.rowSpan,
        widthCm: slot.widthCm,
        heightCm: slot.heightCm,
        priceAgorot: slot.priceAgorot,
        badge: slot.badge,
        active: true,
        sortOrder: slotIndex,
      },
    });
    slotIndex += 1;
  }
  console.log(`  ✓ ${SLOTS.length} משבצות`);

  // --- ערים -----------------------------------------------------
  let cityIndex = 0;
  for (const city of CITIES) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: {},
      create: {
        name: city.name,
        slug: slugify(city.name),
        region: city.region,
        capacity: city.capacity,
        distribution: city.distribution,
        visible: true,
        autoHideWhenFull: false,
        sortOrder: cityIndex,
      },
    });
    cityIndex += 1;
  }
  console.log(`  ✓ ${CITIES.length} ערים`);

  // --- מהדורות ----------------------------------------------------
  // 3 מהדורות פתוחות לכל עיר: החודש הנוכחי ושני החודשים הבאים —
  // כדי שהאשף יהיה בר-בדיקה מיידית אחרי זריעה, בלי תלות בתאריך
  // ריצה. התווית העברית כאן קירוב גס לצורך זריעה בלבד — לא חישוב
  // הלכתי; באדמין אפשר לערוך/ליצור מהדורות עם תוויות מדויקות.
  const HEBREW_MONTH_APPROX = [
    "טבת", "שבט", "אדר", "ניסן", "אייר", "סיוון",
    "תמוז", "אב", "אלול", "תשרי", "חשוון", "כסלו",
  ];

  const cityRows = await prisma.city.findMany({
    select: { id: true, capacity: true },
  });
  const now = new Date();
  let editionCount = 0;

  for (const city of cityRows) {
    for (let i = 0; i < 3; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const gregorianMonth = d.getMonth() + 1;
      const gregorianYear = d.getFullYear();
      const closesAt = new Date(
        now.getTime() + (i + 1) * 20 * 24 * 60 * 60 * 1000,
      );

      await prisma.edition.upsert({
        where: {
          cityId_gregorianYear_gregorianMonth: {
            cityId: city.id,
            gregorianYear,
            gregorianMonth,
          },
        },
        update: {},
        create: {
          cityId: city.id,
          hebrewLabel: HEBREW_MONTH_APPROX[gregorianMonth % 12],
          gregorianMonth,
          gregorianYear,
          capacity: city.capacity,
          closesAt,
          status: "OPEN",
        },
      });
      editionCount += 1;
    }
  }
  console.log(`  ✓ ${editionCount} מהדורות (3 לכל עיר, ${cityRows.length} ערים)`);

  // --- דלי האחסון ------------------------------------------------
  // לא קריטי לזריעה: אם האחסון לא זמין, שאר הנתונים כבר נשמרו
  // ורק העלאת קבצים לא תעבוד עד שיורם.
  try {
    const { ensureBucket } = await import("../src/lib/s3");
    await ensureBucket();
    console.log("  ✓ דלי האחסון");
  } catch (error) {
    console.warn(
      "  ! לא הצלחנו ליצור את דלי האחסון — העלאות קבצים לא יעבדו עד שהאחסון יעלה.",
    );
    console.warn(`    ${(error as Error).message}`);
  }

  console.log("\nהזריעה הושלמה.");
  console.log(`התחברות ללוח הניהול:  /admin  ·  ${email}`);
}

main()
  .catch((error) => {
    console.error("\nהזריעה נכשלה:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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

// ---------------------------------------------------------------
//  תבנית החלונות — תמונות השראה והמקומות השמורים שעליהן.
//
//  תבנית אחת גלובלית לכל הערים והמהדורות (אישור הלקוחה). המכירה
//  עצמה היא לפי מהדורה, דרך AdSlot/SlotReservation כמו תמיד.
//
//  x/y/width/height הם אחוזים מרוחב/גובה התמונה. widthCm/heightCm
//  הם המידות בדפוס בפועל — הם שקובעים "אותו סוג" לצורך חבילות
//  רב-חודשיות (ראו isSameType).
// ---------------------------------------------------------------
const INSPIRATION_IMAGES = [
  {
    label: "קיר מטבח",
    key: "kitchen-wall",
    // גווני קרם/חול חמים — קיר מטבח
    gradient: { top: [232, 222, 206], bottom: [206, 190, 170] },
    aspectRatio: 16 / 9,
    hotspots: [
      {
        sku: "HS-KITCHEN-TILES",
        category: "חנות חיפויים",
        x: 8, y: 12, width: 26, height: 22,
        widthCm: 6.1, heightCm: 3,
        priceAgorot: 80_000,
      },
      {
        sku: "HS-KITCHEN-CABINETS",
        category: "נגריית מטבחים",
        x: 40, y: 10, width: 26, height: 22,
        widthCm: 6.1, heightCm: 3,
        priceAgorot: 80_000,
      },
      {
        sku: "HS-KITCHEN-APPLIANCES",
        category: "חשמל ומוצרי חשמל",
        x: 71, y: 14, width: 21, height: 18,
        widthCm: 2.9, heightCm: 3,
        priceAgorot: 45_000,
      },
      {
        sku: "HS-KITCHEN-TEXTILE",
        category: "טקסטיל לבית",
        x: 12, y: 55, width: 21, height: 18,
        widthCm: 2.9, heightCm: 3,
        priceAgorot: 45_000,
      },
      {
        sku: "HS-KITCHEN-CLEANING",
        category: "חנות כלי בית",
        x: 44, y: 58, width: 21, height: 18,
        widthCm: 2.9, heightCm: 3,
        priceAgorot: 45_000,
      },
      {
        sku: "HS-KITCHEN-LIGHTING",
        category: "חנות תאורה",
        x: 71, y: 55, width: 21, height: 18,
        widthCm: 2.9, heightCm: 3,
        priceAgorot: 45_000,
      },
    ],
  },
  {
    label: "פינת תינוק",
    key: "baby-corner",
    // תכלת/ורוד עדין — חדר תינוק
    gradient: { top: [222, 231, 240], bottom: [238, 222, 228] },
    aspectRatio: 16 / 9,
    hotspots: [
      {
        sku: "HS-BABY-STROLLER",
        category: "חנות תינוקות",
        x: 9, y: 16, width: 28, height: 24,
        widthCm: 6.1, heightCm: 3,
        priceAgorot: 80_000,
      },
      {
        sku: "HS-BABY-CLOTHES",
        category: "חנות הלבשת ילדים",
        x: 43, y: 14, width: 24, height: 20,
        widthCm: 2.9, heightCm: 3,
        priceAgorot: 45_000,
      },
      {
        sku: "HS-BABY-TOYS",
        category: "חנות צעצועים",
        x: 72, y: 18, width: 20, height: 17,
        widthCm: 2.9, heightCm: 3,
        priceAgorot: 45_000,
      },
      {
        sku: "HS-BABY-PHARMACY",
        category: "בית מרקחת",
        x: 14, y: 60, width: 20, height: 17,
        widthCm: 2.9, heightCm: 3,
        priceAgorot: 45_000,
      },
      {
        sku: "HS-BABY-PHOTO",
        category: "צלם/ת ניו-בורן",
        x: 42, y: 57, width: 26, height: 22,
        widthCm: 6.1, heightCm: 3,
        priceAgorot: 80_000,
      },
      {
        sku: "HS-BABY-FURNITURE",
        category: "חנות רהיטים",
        x: 73, y: 60, width: 20, height: 17,
        widthCm: 2.9, heightCm: 3,
        priceAgorot: 45_000,
      },
    ],
  },
] as const;

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
  console.log(`  ✓ ${SLOTS.length} משבצות (פריסת הרשת הישנה)`);

  // --- תמונות השראה וחלונות ---------------------------------------
  // התמונות המחוללות כאן הן מציבות-מקום בלבד. הן עוברות בכוונה
  // דרך אותו מסלול אחסון של כל מדיה אחרת (S3/MinIO תחת media/,
  // הגשה דרך /api/media) — כך שהמסלול נבדק מקצה לקצה, והחלפתן
  // בתמונות אמיתיות היא רק העלאה, בלי שינוי קוד.
  try {
    const { ensureBucket, putArtwork } = await import("../src/lib/s3");
    const { gradientPng } = await import("./placeholder-image");

    await ensureBucket();

    let imageIndex = 0;
    let hotspotTotal = 0;

    for (const image of INSPIRATION_IMAGES) {
      const key = `media/seed-${image.key}.png`;
      const png = gradientPng(
        1200,
        675,
        [...image.gradient.top] as [number, number, number],
        [...image.gradient.bottom] as [number, number, number],
      );
      await putArtwork(key, png, "image/png");

      const imageUrl = `/api/media/${key.replace(/^media\//, "")}`;

      // אין מפתח טבעי ייחודי — מזהים לפי התווית, שהיא ייחודית בתבנית
      const existing = await prisma.inspirationImage.findFirst({
        where: { label: image.label },
      });

      const row = existing
        ? await prisma.inspirationImage.update({
            where: { id: existing.id },
            data: {
              imageUrl,
              aspectRatio: image.aspectRatio,
              sortOrder: imageIndex,
              active: true,
            },
          })
        : await prisma.inspirationImage.create({
            data: {
              label: image.label,
              imageUrl,
              aspectRatio: image.aspectRatio,
              sortOrder: imageIndex,
              active: true,
            },
          });

      let hotspotIndex = 0;
      for (const spot of image.hotspots) {
        // המשבצת (AdSlot) היא היחידה הנמכרת ו-sku שלה ייחודי, ולכן
        // היא נקודת העגינה של הזריעה החוזרת. החלון נתלה עליה.
        const slot = await prisma.adSlot.findUnique({
          where: { sku: spot.sku },
          select: { id: true, hotspotId: true },
        });

        const hotspotData = {
          inspirationImageId: row.id,
          category: spot.category,
          x: spot.x,
          y: spot.y,
          width: spot.width,
          height: spot.height,
          priceAgorot: spot.priceAgorot,
          active: true,
          sortOrder: hotspotIndex,
        };

        const hotspot = slot?.hotspotId
          ? await prisma.hotspot.update({
              where: { id: slot.hotspotId },
              data: hotspotData,
            })
          : await prisma.hotspot.create({ data: hotspotData });

        // מחיר המשבצת נכתב מ-Hotspot.priceAgorot — מקור אמת אחד
        // לכסף, והוא זה שנגבה בקופה.
        await prisma.adSlot.upsert({
          where: { sku: spot.sku },
          update: {
            hotspotId: hotspot.id,
            name: spot.category,
            widthCm: spot.widthCm,
            heightCm: spot.heightCm,
            priceAgorot: spot.priceAgorot,
            active: true,
            sortOrder: 100 + imageIndex * 20 + hotspotIndex,
          },
          create: {
            sku: spot.sku,
            name: spot.category,
            description: `מקום זה שמור ל${spot.category}.`,
            hotspotId: hotspot.id,
            // הרשת הישנה לא רלוונטית לחלון — ערכים ניטרליים
            col: 1,
            row: 1,
            colSpan: 1,
            rowSpan: 1,
            widthCm: spot.widthCm,
            heightCm: spot.heightCm,
            priceAgorot: spot.priceAgorot,
            active: true,
            sortOrder: 100 + imageIndex * 20 + hotspotIndex,
          },
        });

        hotspotIndex += 1;
        hotspotTotal += 1;
      }

      imageIndex += 1;
    }

    console.log(
      `  ✓ ${INSPIRATION_IMAGES.length} תמונות השראה · ${hotspotTotal} חלונות`,
    );
  } catch (error) {
    console.warn(
      "  ! זריעת תמונות ההשראה נכשלה — כנראה שהאחסון (MinIO) לא רץ.",
    );
    console.warn(`    ${(error as Error).message}`);
  }

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

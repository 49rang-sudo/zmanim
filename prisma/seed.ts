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
//  סצנות הקונספט — לכל חודש סצנה משלו, ועליה המקומות השמורים.
//
//  לכל חודש קונספט אחר ("שיפוץ הבית", "לימודים והתפתחות"…), ואותו
//  חודש חוזר באותה סצנה בכל הערים. המכירה עצמה נשארת לפי מהדורה,
//  דרך AdSlot/SlotReservation כמו תמיד.
//
//  monthOffset = כמה חודשים קדימה מהיום שבו הזריעה רצה. ככה שלוש
//  הסצנות נופלות בדיוק על שלוש המהדורות שהזריעה יוצרת, וסביבת
//  הפיתוח מדגימה את המודל החדש (סצנה שונה בכל דפדוף חודש) בלי
//  תלות בתאריך ההרצה. הסצנה עם monthOffset = null היא הסצנה
//  *הכללית* — הגיבוי לכל חודש שאין לו אמנות ייעודית.
//
//  ⚠ שיוך הקונספטים לחודשים העבריים האמיתיים (אלול = שיפוץ,
//  תשרי = לימודים…) מגיע מהלקוחה והמעצבת. כאן זו הדגמה בלבד.
//
//  x/y/width/height הם אחוזים מרוחב/גובה התמונה. widthCm/heightCm
//  הם המידות בדפוס בפועל — הם, יחד עם הדרגה, קובעים "אותו סוג"
//  לצורך חבילות רב-חודשיות (ראו isSameType).
// ---------------------------------------------------------------

/** מידות הדפוס לכל דרגה — אחידות בכל הסצנות, וזו לא קוסמטיקה:
 *  isSameType דורש התאמה מלאה, ולכן רק גדלים אחידים מאפשרים חבילה
 *  שמדלגת בין סצנות של חודשים שונים. */
const TIER_PRINT_SIZE = {
  ANCHOR: { widthCm: 6.1, heightCm: 6.3 },
  COMPLEMENTARY: { widthCm: 2.9, heightCm: 3 },
} as const;

/**
 * גיאומטריה משותפת לכל הסצנות: שני עוגנים גדולים בחצי העליון,
 * ארבעה משלימים ברצועה התחתונה. שני עוגנים ולא אחד בכוונה — כך
 * "כל העוגנים נתפסו" הוא מצב שדורש שתי מכירות, וסביבת הפיתוח
 * באמת מדגימה שהמלאי של שתי הדרגות נספר בנפרד.
 */
const SCENE_LAYOUT = [
  { tier: "ANCHOR", x: 4, y: 8, width: 44, height: 52 },
  { tier: "ANCHOR", x: 52, y: 8, width: 44, height: 52 },
  { tier: "COMPLEMENTARY", x: 4, y: 66, width: 21, height: 24 },
  { tier: "COMPLEMENTARY", x: 28, y: 66, width: 20, height: 24 },
  { tier: "COMPLEMENTARY", x: 52, y: 66, width: 20, height: 24 },
  { tier: "COMPLEMENTARY", x: 75, y: 66, width: 21, height: 24 },
] as const;

/** מחיר העוגן — 1600 ₪, המספר שהלקוחה מסרה */
const ANCHOR_PRICE_AGOROT = 160_000;

/**
 * מחירי המשלימים — 1200–1350 ₪, פרוסים על פני ארבעת המקומות.
 * מכוון: הלקוחה אמרה שהמחיר נקבע פר-מיקום ואינו קבוע אחד, ולכן
 * הזריעה חייבת להדגים טווח ולא מספר יחיד — אחרת באג "כולם באותו
 * מחיר" לא היה נראה בפיתוח.
 */
const COMPLEMENTARY_PRICES_AGOROT = [135_000, 130_000, 125_000, 120_000];

type SceneSpec = {
  label: string;
  key: string;
  /** null = הסצנה הכללית (גיבוי לכל חודש בלי אמנות ייעודית) */
  monthOffset: number | null;
  gradient: { top: [number, number, number]; bottom: [number, number, number] };
  aspectRatio: number;
  skuPrefix: string;
  /** שתי הראשונות = העוגנים, אחריהן ארבע המשלימות — סדר SCENE_LAYOUT */
  categories: [string, string, string, string, string, string];
  /**
   * מק״טים מפורשים, כשקיימים כבר במסד מזריעות קודמות. המק״ט הוא
   * נקודת העגינה של הזריעה החוזרת (AdSlot.sku ייחודי), ולכן שינוי
   * שמות היה יוצר סט משבצות שני במקום לעדכן את הקיים.
   */
  skus?: [string, string, string, string, string, string];
};

const SCENES: SceneSpec[] = [
  {
    label: "שיפוץ הבית",
    key: "home-renovation",
    monthOffset: 0,
    // חול חם — עבודות גמר בבית
    gradient: { top: [236, 226, 210], bottom: [206, 188, 164] },
    aspectRatio: 16 / 9,
    skuPrefix: "HS-RENO",
    categories: [
      "נגריית מטבחים",
      "עיצוב פנים",
      "חנות תאורה",
      "חנות חיפויים וריצוף",
      "צבע וכלי עבודה",
      "מיזוג ואינסטלציה",
    ],
  },
  {
    label: "לימודים והתפתחות",
    key: "learning",
    monthOffset: 1,
    // תכלת קריר — כיתה/ספרייה
    gradient: { top: [220, 230, 242], bottom: [190, 205, 224] },
    aspectRatio: 16 / 9,
    skuPrefix: "HS-LEARN",
    categories: [
      "מכללה וקורסים",
      "ייעוץ והכוונה לימודית",
      "חנות ספרים",
      "ציוד משרדי וכתיבה",
      "מחשבים וטכנולוגיה",
      "חוגים לילדים",
    ],
  },
  {
    label: "פינת תינוק",
    key: "baby-corner",
    monthOffset: 2,
    // תכלת/ורוד עדין — חדר תינוק
    gradient: { top: [222, 231, 240], bottom: [238, 222, 228] },
    aspectRatio: 16 / 9,
    skuPrefix: "HS-BABY",
    categories: [
      "חנות תינוקות",
      "חנות רהיטים",
      "חנות הלבשת ילדים",
      "חנות צעצועים",
      "בית מרקחת",
      "צלם/ת ניו-בורן",
    ],
    skus: [
      "HS-BABY-STROLLER",
      "HS-BABY-FURNITURE",
      "HS-BABY-CLOTHES",
      "HS-BABY-TOYS",
      "HS-BABY-PHARMACY",
      "HS-BABY-PHOTO",
    ],
  },
  {
    // הסצנה הכללית: מה שיוצג בכל חודש שאין לו אמנות ייעודית.
    // בלעדיה, מהדורה בחודש לא-מכוסה הייתה מציגה לוח ריק.
    label: "קיר מטבח",
    key: "kitchen-wall",
    monthOffset: null,
    gradient: { top: [232, 222, 206], bottom: [206, 190, 170] },
    aspectRatio: 16 / 9,
    skuPrefix: "HS-KITCHEN",
    categories: [
      "נגריית מטבחים",
      "חנות חיפויים",
      "חנות כלי בית",
      "חשמל ומוצרי חשמל",
      "טקסטיל לבית",
      "חנות תאורה",
    ],
    skus: [
      "HS-KITCHEN-CABINETS",
      "HS-KITCHEN-TILES",
      "HS-KITCHEN-CLEANING",
      "HS-KITCHEN-APPLIANCES",
      "HS-KITCHEN-TEXTILE",
      "HS-KITCHEN-LIGHTING",
    ],
  },
];

/** פורש סצנה לרשימת חלונות מלאה — גיאומטריה + דרגה + מחיר + מק״ט */
function sceneHotspots(scene: SceneSpec) {
  let complementaryIndex = 0;

  return SCENE_LAYOUT.map((spot, index) => {
    const tier = spot.tier;
    const priceAgorot =
      tier === "ANCHOR"
        ? ANCHOR_PRICE_AGOROT
        : COMPLEMENTARY_PRICES_AGOROT[
            complementaryIndex++ % COMPLEMENTARY_PRICES_AGOROT.length
          ];

    return {
      sku:
        scene.skus?.[index] ??
        `${scene.skuPrefix}-${String(index + 1).padStart(2, "0")}`,
      category: scene.categories[index],
      tier,
      x: spot.x,
      y: spot.y,
      width: spot.width,
      height: spot.height,
      ...TIER_PRINT_SIZE[tier],
      priceAgorot,
    };
  });
}

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
  //
  // שלוש מתוך ארבע הסצנות מקבלות כאן תמונת קונספט אמיתית (מאוחסנת
  // אצל המעצבת ב-Base44) במקום גרדיאנט מחולל, כחלק מה-reskin
  // הוויזואלי — כדי שה-Showcase/בורר החודשים/מוקאפ הלוח יראו תמונה
  // אמיתית ולא רק כתם צבע. "פינת תינוק" (baby-corner) נשארת גרדיאנט:
  // אין לה תמונת קונספט תואמת בין הארבע שסופקו.
  const SCENE_IMAGE_URLS: Record<string, string> = {
    "home-renovation":
      "https://media.base44.com/images/public/6a8da2d186a845297989d3b3/877d70f0f_generated_image.png",
    learning:
      "https://media.base44.com/images/public/6a8da2d186a845297989d3b3/76ca527df_generated_image.png",
    "kitchen-wall":
      "https://media.base44.com/images/public/6a8da2d186a845297989d3b3/2f6528392_generated_image.png",
  };

  async function fetchBytes(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`הורדת תמונת קונספט נכשלה (${res.status}): ${url}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  try {
    const { ensureBucket, putArtwork } = await import("../src/lib/s3");
    const { gradientPng } = await import("./placeholder-image");

    await ensureBucket();

    let imageIndex = 0;
    let hotspotTotal = 0;
    const now = new Date();

    for (const image of SCENES) {
      const key = `media/seed-${image.key}.png`;
      const sourceUrl = SCENE_IMAGE_URLS[image.key];
      const png = sourceUrl
        ? await fetchBytes(sourceUrl)
        : gradientPng(
            1200,
            675,
            [...image.gradient.top] as [number, number, number],
            [...image.gradient.bottom] as [number, number, number],
          );
      await putArtwork(key, png, "image/png");

      const imageUrl = `/api/media/${key.replace(/^media\//, "")}`;

      // monthOffset נמדד מהיום שהזריעה רצה, כדי שהסצנות ייפלו בדיוק
      // על המהדורות שנוצרות בהמשך. null נשאר null — הסצנה הכללית.
      const gregorianMonth =
        image.monthOffset === null
          ? null
          : new Date(
              now.getFullYear(),
              now.getMonth() + image.monthOffset,
              1,
            ).getMonth() + 1;

      // אין מפתח טבעי ייחודי — מזהים לפי התווית, שהיא ייחודית בתבנית
      const existing = await prisma.inspirationImage.findFirst({
        where: { label: image.label },
      });

      const row = existing
        ? await prisma.inspirationImage.update({
            where: { id: existing.id },
            data: {
              imageUrl,
              gregorianMonth,
              aspectRatio: image.aspectRatio,
              sortOrder: imageIndex,
              active: true,
            },
          })
        : await prisma.inspirationImage.create({
            data: {
              label: image.label,
              imageUrl,
              gregorianMonth,
              aspectRatio: image.aspectRatio,
              sortOrder: imageIndex,
              active: true,
            },
          });

      const spots = sceneHotspots(image);
      const keptHotspotIds: string[] = [];

      let hotspotIndex = 0;
      for (const spot of spots) {
        // המשבצת (AdSlot) היא היחידה הנמכרת ו-sku שלה ייחודי, ולכן
        // היא נקודת העגינה של הזריעה החוזרת. החלון נתלה עליה.
        const slot = await prisma.adSlot.findUnique({
          where: { sku: spot.sku },
          select: { id: true, hotspotId: true },
        });

        const hotspotData = {
          inspirationImageId: row.id,
          category: spot.category,
          tier: spot.tier,
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

        keptHotspotIds.push(hotspot.id);

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

      // חלון שנשאר על הסצנה מזריעה קודמת אך אינו בתבנית הנוכחית
      // מנוטרל, לא נמחק: מחיקה הייתה מנתקת בשקט (SetNull) משבצת
      // שהזמנות עבר מצביעות עליה. נטרול מוציא אותו מהמכירה ומהספירה
      // בלי לגעת בהיסטוריה.
      const stale = await prisma.hotspot.updateMany({
        where: {
          inspirationImageId: row.id,
          id: { notIn: keptHotspotIds },
          active: true,
        },
        data: { active: false },
      });
      if (stale.count > 0) {
        console.log(
          `  · ${stale.count} חלונות ישנים נוטרלו בסצנה "${image.label}"`,
        );
      }

      imageIndex += 1;
    }

    console.log(
      `  ✓ ${SCENES.length} סצנות קונספט · ${hotspotTotal} מקומות ` +
        `(עוגן + משלימים, לפי חודש)`,
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

  // המלאי האמיתי הנמכר בחודש נתון הוא מספר החלונות הפעילים בסצנה
  // *של אותו חודש* — לא הסכום הגלובלי. City.capacity הוא שריד
  // מהמודל הישן (רשת per-city) ויכול להיות גבוה יותר; הקיבולת
  // הנשמרת לעולם לא תעלה על מה שבאמת ניתן למכור בחודש הזה.
  //
  // (src/lib/availability.ts אוכף את אותה תקרה שוב בזמן קריאה,
  // כדי שגם מהדורות שנוצרו ידנית באדמין לא יבטיחו מלאי שלא קיים.)
  const activeHotspots = await prisma.hotspot.findMany({
    where: {
      active: true,
      slot: { is: { active: true } },
      inspirationImage: { is: { active: true } },
    },
    select: { inspirationImage: { select: { gregorianMonth: true } } },
  });

  const countByMonth = new Map<number, number>();
  let genericCount = 0;
  for (const hotspot of activeHotspots) {
    const month = hotspot.inspirationImage.gregorianMonth;
    if (month === null) genericCount += 1;
    else countByMonth.set(month, (countByMonth.get(month) ?? 0) + 1);
  }
  const sellableIn = (month: number) => countByMonth.get(month) ?? genericCount;

  for (const city of cityRows) {
    for (let i = 0; i < 3; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const gregorianMonth = d.getMonth() + 1;
      const gregorianYear = d.getFullYear();
      const closesAt = new Date(
        now.getTime() + (i + 1) * 20 * 24 * 60 * 60 * 1000,
      );
      const sellable = sellableIn(gregorianMonth);

      await prisma.edition.upsert({
        where: {
          cityId_gregorianYear_gregorianMonth: {
            cityId: city.id,
            gregorianYear,
            gregorianMonth,
          },
        },
        // הקיבולת כן מתעדכנת בזריעה חוזרת: אחרי שהתבנית משתנה
        // (סצנה חדשה, חלון שנוטרל) מהדורה שנשארה עם המספר הישן
        // הייתה מציגה מלאי שלא קיים.
        update: {
          capacity: sellable ? Math.min(city.capacity, sellable) : city.capacity,
        },
        create: {
          cityId: city.id,
          hebrewLabel: HEBREW_MONTH_APPROX[gregorianMonth % 12],
          gregorianMonth,
          gregorianYear,
          capacity: sellable ? Math.min(city.capacity, sellable) : city.capacity,
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

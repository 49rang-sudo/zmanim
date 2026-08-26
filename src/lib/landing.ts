import { getCityAvailability, getOpenEditionsForCity } from "./availability";
import { getInspirationBoard, type BoardImage } from "./site";
import { boardForMonth } from "./board";
import type { PresenceTier } from "./packages";
import type {
  LandingCategory,
  LandingData,
  LandingMonth,
  LandingTier,
  TierPriceRange,
} from "./landing-shared";

/* ===============================================================
   הנתונים האמיתיים שמאחורי עמוד הנחיתה.

   כל מספר וכל סטטוס בעמוד השיווקי מגיעים מכאן, כלומר ממסד
   הנתונים: אילו חודשים פתוחים, איזו סצנה בכל חודש, אילו תחומים
   יש בה, מי כבר נתפס, וכמה עולה הזול ביותר שנשאר.

   שום מחסור לא נכתב ביד. "התחום נתפס בחודש הזה" מופיע אך ורק
   כשיש שורת SlotReservation אמיתית מאחוריו.

   ⚠ הטיפוסים והפונקציה categoryMatches יושבים ב-landing-shared.ts
   ולא כאן, כי הבורר בצד הלקוח משתמש בהם — ראו ההערה שם.
   =============================================================== */

export type {
  LandingCategory,
  LandingData,
  LandingMonth,
  LandingTier,
  TierPriceRange,
};

const EMPTY_TIER: LandingTier = {
  capacity: 0,
  taken: 0,
  remaining: 0,
  isFull: true,
};

function priceRange(
  board: BoardImage[],
  tier: PresenceTier,
): TierPriceRange | null {
  const prices = board
    .flatMap((image) => image.hotspots)
    .filter((hotspot) => hotspot.tier === tier)
    .map((hotspot) => hotspot.slot.priceAgorot);

  if (prices.length === 0) return null;

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    count: prices.length,
  };
}

/**
 * הכול-בכול לעמוד הנחיתה, לעיר אחת.
 *
 * preferredCityName מגיע מהתוכן (landing.months.cityName). אם הוא
 * ריק או מצביע על עיר שאין לה מהדורה פתוחה — נופלים לעיר הגלויה
 * הראשונה שיש לה מהדורות. עדיף להציג את החודשים של עיר אחרת
 * מאשר אזור ריק בלב עמוד המכירה.
 */
export async function getLandingData(
  preferredCityName: string,
): Promise<LandingData> {
  const [cities, board] = await Promise.all([
    getCityAvailability(),
    getInspirationBoard(),
  ]);

  const wanted = preferredCityName.trim();
  const city =
    cities.find((c) => c.name === wanted && c.openEditionsCount > 0) ??
    cities.find((c) => c.openEditionsCount > 0) ??
    null;

  const prices = {
    ANCHOR: priceRange(board, "ANCHOR"),
    COMPLEMENTARY: priceRange(board, "COMPLEMENTARY"),
  };

  const allCategories = Array.from(
    new Set(
      board.flatMap((image) => image.hotspots.map((h) => h.category.trim())),
    ),
  ).sort((a, b) => a.localeCompare(b, "he"));

  if (!city) {
    return { cityName: null, cityId: null, months: [], editions: [], prices, allCategories };
  }

  const editions = await getOpenEditionsForCity(city.id);

  const months: LandingMonth[] = editions.map((edition) => {
    // אותו כלל בחירת סצנה בדיוק שבו נספר המלאי בשרת ובו מדפדף
    // הלקוח באשף — אחרת הכרטיס היה מבטיח תחומים מסצנה אחרת.
    const scenes = boardForMonth(board, edition.gregorianMonth);
    const occupied = new Set(edition.occupiedSlotIds);

    const categories: LandingCategory[] = scenes.flatMap((scene) =>
      scene.hotspots.map((hotspot) => ({
        slotId: hotspot.slot.id,
        name: hotspot.category,
        tier: hotspot.tier,
        priceAgorot: hotspot.slot.priceAgorot,
        taken: occupied.has(hotspot.slot.id),
      })),
    );

    const free = categories.filter((c) => !c.taken);

    return {
      editionId: edition.id,
      hebrewLabel: edition.hebrewLabel,
      gregorianMonth: edition.gregorianMonth,
      gregorianYear: edition.gregorianYear,
      conceptTitle: scenes[0]?.label ?? "",
      imageUrl: scenes[0]?.imageUrl ?? null,
      aspectRatio: scenes[0]?.aspectRatio ?? 1.5,
      categories,
      tiers: {
        ANCHOR: edition.tiers?.ANCHOR ?? EMPTY_TIER,
        COMPLEMENTARY: edition.tiers?.COMPLEMENTARY ?? EMPTY_TIER,
      },
      // "החל מ־" הוא הבטחה: הוא חייב להיות מחיר שאפשר באמת לקנות
      // עכשיו, ולכן נספר רק מבין המקומות הפנויים.
      fromPriceAgorot:
        free.length > 0 ? Math.min(...free.map((c) => c.priceAgorot)) : null,
      marketingNote: edition.marketingNote,
    };
  });

  return { cityName: city.name, cityId: city.id, months, editions, prices, allCategories };
}

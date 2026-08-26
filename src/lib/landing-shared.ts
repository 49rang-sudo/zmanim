import type { PresenceTier } from "./packages";
// ייבוא-טיפוס בלבד: נמחק בזמן קומפילציה, לא גורר את prisma
// שמיובא בפועל בתוך availability.ts לחבילת הלקוח.
import type { EditionAvailability } from "./availability";

/* ===============================================================
   הטיפוסים והפונקציות הטהורות של עמוד הנחיתה — בלי prisma.

   הקובץ נפרד מ-src/lib/landing.ts בדיוק מאותה סיבה ש-board.ts
   נפרד מ-site.ts: בורר החודשים הוא רכיב לקוח, וייבוא *ערך*
   מקובץ שמייבא את לקוח מסד הנתונים גורר את pg כולו לחבילת
   הדפדפן ומפיל את הבנייה על "Can't resolve 'dns'".

   כלל אצבע לקובץ הזה: אין כאן שום ייבוא שאינו טיפוס.
   =============================================================== */

/** מלאי של דרגה אחת — משוקף מ-TierAvailability, בלי לגרור prisma */
export type LandingTier = {
  capacity: number;
  taken: number;
  remaining: number;
  isFull: boolean;
};

/** תחום עסקי אחד בתוך סצנה של חודש */
export type LandingCategory = {
  slotId: string;
  name: string;
  tier: PresenceTier;
  priceAgorot: number;
  /** תפוס (החזקה זמנית או מכירה סופית) במהדורה הזו */
  taken: boolean;
};

export type LandingMonth = {
  editionId: string;
  /** "אלול", "תשרי" — התווית שהמנהלת הזינה למהדורה */
  hebrewLabel: string;
  gregorianMonth: number;
  gregorianYear: number;
  /** שם הסצנה של החודש — "שיפוץ הבית", "פינת תינוק" */
  conceptTitle: string;
  imageUrl: string | null;
  aspectRatio: number;
  categories: LandingCategory[];
  tiers: Record<PresenceTier, LandingTier>;
  /** המחיר הזול ביותר שעדיין אפשר לקנות בחודש הזה, באגורות */
  fromPriceAgorot: number | null;
  marketingNote: string | null;
};

export type TierPriceRange = {
  min: number;
  max: number;
  /** סך המקומות מהדרגה הזו בכל הסצנות הפעילות */
  count: number;
};

export type LandingData = {
  cityName: string | null;
  cityId: string | null;
  months: LandingMonth[];
  /**
   * אותן מהדורות בדיוק שמאחורי months, במלוא הצורה (כולל
   * occupiedSlotIds/soldBySlotId/tiers) — זה מה שמניע את דפדוף
   * הלוח הגדול בעמוד הנחיתה (CalendarBrowser), באותה נקודת אמת
   * שממנה נגזר months. אותו editionId מזהה את שניהם.
   */
  editions: EditionAvailability[];
  /** טווח המחירים בפועל לכל דרגה — מזין את אזור המחירים (סעיף 8) */
  prices: Record<PresenceTier, TierPriceRange | null>;
  /** כל התחומים הקיימים בכל הסצנות */
  allCategories: string[];
};

/* --------------------------------------------------------------- */

/** מנקה גרשיים, מקפים ורווחים כפולים לפני השוואה */
export function normalizeCategory(value: string): string {
  return value
    .replace(/[׳״'"]/g, "")
    .replace(/[־–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * האם מה שהוקלד בשדה "מה העסק שלכם עושה?" מתאים לתחום מסוים.
 *
 * לא חיפוש טקסט חכם ולא דמיון מחרוזות — התאמת מילים פשוטה
 * לשני הכיוונים, כי זה בדיוק מה שהקהל מקליד: "תאורה" צריך
 * למצוא את "חנות תאורה", ו"חנות תינוקות ועגלות" צריך למצוא את
 * "חנות תינוקות". מילה בת אות אחת מתעלמים ממנה — היא מתאימה
 * לכל דבר ורק מייצרת רעש.
 */
export function categoryMatches(category: string, query: string): boolean {
  const target = normalizeCategory(category);
  const words = normalizeCategory(query)
    .split(" ")
    .filter((word) => word.length >= 2);

  if (words.length === 0) return false;

  return words.some((word) => target.includes(word) || word.includes(target));
}

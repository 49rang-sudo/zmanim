/**
 * תמחור חבילות מרובות-מהדורות (חודשים), לפי דרגת הנוכחות.
 *
 * ---------------------------------------------------------------
 *  המספרים שהלקוחה מסרה (שקלים, כוללים מע"מ — לא מוסיפים מע"מ מעל)
 * ---------------------------------------------------------------
 *  עוגן:    חודש = 1600 · 2 חודשים = 1530 לחודש ·
 *           3 חודשים = 1450 לחודש · 4+ = 10% הנחה מהרכישה השנייה.
 *  משלים:   חודש = 1200–1350 (נקבע פר-חלון!) · 2 חודשים = 5% הנחה ·
 *           3+ = 10% הנחה מהרכישה השנייה והלאה.
 *
 * ---------------------------------------------------------------
 *  איך זה מתורגם לקוד
 * ---------------------------------------------------------------
 *  1. הסולם נשמר כ*יחסים* למחיר החודש הבודד ולא כסכומים קשיחים:
 *     1530/1600 = 0.95625 ו-1450/1600 = 0.90625 — בבסיס 1600 זה
 *     נותן בדיוק 1530 ו-1450. הסיבה: מקור האמת לכסף הוא
 *     AdSlot.priceAgorot (ראו ההערה ב-Hotspot בסכמה), והמנהלת
 *     יכולה לשנות אותו מלוח הניהול. סכום קשיח כאן היה נשבר בשקט
 *     ברגע ששינו מחיר; יחס מתעדכן איתו.
 *
 *  2. אצל המשלים ה"בסיס" באמת משתנה בין חלון לחלון (1200–1350),
 *     ולכן דווקא שם הייצוג היחסי הוא היחיד שעובד בכלל.
 *
 *  3. "10% מהרכישה השנייה והלאה" = החודש הראשון במחיר מלא, כל חודש
 *     נוסף ב-90%.
 *
 *  4. תקרת מונוטוניות: התחייבות ארוכה יותר לעולם לא יקרה יותר
 *     *לחודש* מהתחייבות קצרה ממנה. ראו האנומליה למטה.
 *
 * ---------------------------------------------------------------
 *  ⚠ אנומליה במחירון שנמסר — נדרש אישור הלקוחה
 * ---------------------------------------------------------------
 *  לעוגן, "4+ = 10% מהרכישה השנייה" על בסיס 1600 נותן
 *  1600 + 3×1440 = 5920 לארבעה חודשים, כלומר 1480 לחודש — *יקר
 *  יותר* לחודש מ-3 חודשים (1450). לפי המחירון המילולי היה משתלם
 *  לקנות 3 חודשים ולהוסיף רביעי בנפרד. אנחנו לא גובים את המדרגה
 *  השבורה הזו: תקרת המונוטוניות מקבעת 4+ על 1450 לחודש (הזול
 *  מבין השניים, לטובת הלקוח). כשיתברר מה הכוונה ל-4+, כל השינוי
 *  הנדרש הוא ב-TIER_PRICING.ANCHOR ותו לא.
 */

/** דרגת הנוכחות של החלון — משוקף מ-HotspotTier בסכמה */
export type PresenceTier = "ANCHOR" | "COMPLEMENTARY";

export const TIER_LABELS: Record<PresenceTier, string> = {
  ANCHOR: "עוגן",
  COMPLEMENTARY: "משלים",
};

export const TIER_DESCRIPTIONS: Record<PresenceTier, string> = {
  ANCHOR:
    "נוכחות מרכזית בסצנה של החודש — האלמנט הראשי בתמונה, השטח הגדול ביותר.",
  COMPLEMENTARY:
    "נוכחות משלימה — מוצר או פריט מסוים בתוך הסצנה, בשטח קטן יותר.",
};

type TierPricing = {
  /**
   * מחיר לחודש כיחס למחיר החודש הבודד, לפי אורך ההתחייבות.
   * אינדקס 0 = חודש אחד. אלו המדרגות שהלקוחה נקבה בהן במפורש.
   */
  perMonthRate: number[];
  /** מעבר לסולם המפורש: הנחה על כל חודש מהשני והלאה */
  tailDiscount: number;
  /** תווית לתצוגה, לצד המספרים */
  tailLabel: string;
};

export const TIER_PRICING: Record<PresenceTier, TierPricing> = {
  ANCHOR: {
    // 1600 · 1530 · 1450  →  1 · 0.95625 · 0.90625
    perMonthRate: [1, 0.95625, 0.90625],
    tailDiscount: 0.1,
    tailLabel: "10% הנחה מהחודש השני והלאה",
  },
  COMPLEMENTARY: {
    // מחיר החודש הבודד נקבע פר-חלון (1200–1350) — כאן רק הסולם
    perMonthRate: [1, 0.95],
    tailDiscount: 0.1,
    tailLabel: "10% הנחה מהחודש השני והלאה",
  },
};

/**
 * כמה "מחירי חודש בודד" משלמים בסך הכול עבור n חודשים. מוחזר
 * כמקדם (n חודשים במחיר מלא = n), כדי שאפשר יהיה להכפיל בו גם
 * מחיר אחיד וגם סכום גולמי של מחירים שונים.
 *
 * התקרה בכל צעד: העלות לחודש ב-n חודשים לא יכולה לעלות על העלות
 * לחודש ב-(n-1) חודשים. זו ההגנה שמונעת את המדרגה השבורה של 4+
 * בעוגן, והיא no-op בכל מקום שבו המחירון כבר מונוטוני (כמו במשלים).
 */
export function packageFactor(tier: PresenceTier, months: number): number {
  if (months <= 1) return Math.max(0, months);

  const { perMonthRate, tailDiscount } = TIER_PRICING[tier];
  let previous = 1; // סך הכול לחודש אחד = מחיר בודד אחד

  for (let n = 2; n <= months; n += 1) {
    // מדרגה שהלקוחה נקבה בה במפורש גוברת. רק מעבר לסולם המפורש
    // נכנס כלל הזנב — "מחיר מלא על הראשון, 90% על כל אחד אחריו"
    // (4+ בעוגן, 3+ במשלים).
    const rate =
      n <= perMonthRate.length
        ? perMonthRate[n - 1] * n
        : 1 + (n - 1) * (1 - tailDiscount);
    // תקרת מונוטוניות מול ההתחייבות הקצרה ממנה בחודש אחד
    const cap = (previous / (n - 1)) * n;
    previous = Math.min(rate, cap);
  }

  return previous;
}

/**
 * המחיר לחודש (באגורות) בהתחייבות של n חודשים — *לתצוגה בלבד*.
 * מה שנגבה בפועל הוא תמיד הסכום הכולל, ולכן החלוקה כאן מעוגלת
 * לשקל שלם: "1,213.33 ₪ לחודש" הוא רעש לקהל לא-טכני, והשארית
 * ממילא לא מופיעה באף חיוב.
 */
export function perMonthAgorot(
  tier: PresenceTier,
  unitPriceAgorot: number,
  months: number,
): number {
  if (months <= 0) return 0;
  const exact = (unitPriceAgorot * packageFactor(tier, months)) / months;
  return Math.round(exact / 100) * 100;
}

/**
 * מחיר משוער על פני N מהדורות, באגורות — תצוגה מקדימה (TierPicker,
 * FocusPanel) לפני שנבחרו המשבצות בפועל בכל חודש, כשמניחים אותו
 * מחיר חודשי בכל החודשים. אחרי הבחירה בפועל המחיר האמיתי מחושב
 * עם sumWithPackageDiscount.
 */
export function packageTotalAgorotForEditions(
  unitPriceAgorot: number,
  editionsCount: number,
  tier: PresenceTier,
): number {
  return Math.round(unitPriceAgorot * packageFactor(tier, editionsCount));
}

/**
 * המחיר הכולל האמיתי לרשימת מחירים שיכולים להיות שונים — חלון אחר
 * בכל חודש, ואצל המשלים גם מחיר אחר (1200–1350). מכפילים את הסכום
 * הגולמי ביחס ההנחה הממוצע של אורך ההתחייבות, כך שההנחה נפרסת
 * פרופורציונית על כל החודשים במקום להיצמד לחודש שרירותי.
 */
export function sumWithPackageDiscount(
  pricesAgorot: number[],
  tier: PresenceTier,
): number {
  const months = pricesAgorot.length;
  if (months === 0) return 0;

  const gross = pricesAgorot.reduce((sum, p) => sum + p, 0);
  return Math.round((gross * packageFactor(tier, months)) / months);
}

/** אחוז החיסכון מול תשלום מלא — מספר שלם לתצוגה ("חיסכון 9%") */
export function savingsPercent(tier: PresenceTier, months: number): number {
  if (months <= 1) return 0;
  return Math.round((1 - packageFactor(tier, months) / months) * 100);
}

/**
 * דרגות פריסט להתחייבות מרובת-מהדורות (חודשים). אלו תוויות
 * שיווקיות שמסמנות "כמה מהדורות לסמן מראש" בצ'קליסט הבחירה באשף
 * — הבחירה בפועל היא צ'קבוקסים חופשיים על מהדורות אמיתיות
 * (ראו Edition ב-schema.prisma ו-src/lib/availability.ts).
 *
 * שדה discount הוסר בכוונה: אותה כמות חודשים עולה אחרת לעוגן
 * ולמשלים, ולכן ההנחה נגזרת מ-TIER_PRICING לפי דרגת החלון שנבחר
 * ולא נשמרת כמספר קבוע לדרגת חבילה.
 */
export const AD_PACKAGES = [
  { id: "SINGLE", label: "פרסום חד־פעמי", editions: 1 },
  { id: "SILVER_PLUS", label: "סילבר+", editions: 2 },
  { id: "SILVER", label: "סילבר", editions: 3 },
  { id: "GOLD", label: "זהב", editions: 5 },
  { id: "PLATINUM", label: "פלטינום", editions: 6 },
] as const;

export type PackageId = (typeof AD_PACKAGES)[number]["id"];

export function getPackage(id: string) {
  return AD_PACKAGES.find((p) => p.id === id);
}

/**
 * ברירות מחדל ליצירת Hotspot+AdSlot חדשים מהאדמין (ראו
 * src/app/api/admin/hotspots/route.ts) — "יצירת Hotspot חדש תיצור
 * אוטומטית גם AdSlot מקושר, עם שם/מחיר ברירת מחדל שניתנים לעריכה
 * אחר כך" (הוחלט בתוכנית המיגרציה, שלב 5).
 *
 * הערכים תואמים בכוונה למה שכבר בשימוש בזריעת הדגמה (prisma/seed.ts:
 * ANCHOR_PRICE_AGOROT, TIER_PRINT_SIZE, COMPLEMENTARY_PRICES_AGOROT) —
 * לא מומצאים כאן מחדש. עוגן = 1,600 ₪ (המספר שהלקוחה מסרה לחודש בודד).
 * משלים = 1,300 ₪, אמצע הטווח שהלקוחה מסרה (1,200–1,350 ₪) — כי מחיר
 * משלים אמיתי נקבע פר-חלון, וזו רק נקודת פתיחה נוחה לעריכה.
 */
export const DEFAULT_TIER_BASE_PRICE_AGOROT: Record<PresenceTier, number> = {
  ANCHOR: 160_000,
  COMPLEMENTARY: 130_000,
};

/** מידות הדפוס בפועל לכל דרגה — זהות ל-TIER_PRINT_SIZE ב-prisma/seed.ts */
export const TIER_PRINT_SIZE_CM: Record<
  PresenceTier,
  { widthCm: number; heightCm: number }
> = {
  ANCHOR: { widthCm: 6.1, heightCm: 6.3 },
  COMPLEMENTARY: { widthCm: 2.9, heightCm: 3 },
};

/* ===============================================================
   תרגום תאריך עברי → תאריך לועזי, מול לוח השנה העברי האמיתי
   של Intl. אין כאן טבלת תאריכים קשיחה ואין חישוב מקורב.

   זה מה שמחליט אם בונוס "המצטרפים הראשונים" (סעיף 11 בקופי)
   מוצג או לא. ההכרעה נעשית *בשרת*, בזמן הרינדור, ולכן ההטבה
   באמת נעלמת מה-HTML כשהיא נגמרת — ולא רק מוסתרת ב-CSS אצל
   מי שיודע לפתוח כלי מפתחים.

   אותה גישה בדיוק כמו ב-MonthSheet.tsx: Intl.DateTimeFormat עם
   he-u-ca-hebrew, קריאת formatToParts, בלי ספריית תאריכים.
   =============================================================== */

const hebrewFormat = new Intl.DateTimeFormat("he-u-ca-hebrew", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export type HebrewParts = { day: number; month: string; year: number };

/** מספר מתוך חלק תאריך — גם כשה-ICU מחזיר ספרות עבריות (כ״ף) */
function partToNumber(raw: string): number {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits) return Number(digits);

  const values: Record<string, number> = {
    א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9,
    י: 10, כ: 20, ל: 30, מ: 40, נ: 50, ס: 60, ע: 70, פ: 80, צ: 90,
    ק: 100, ר: 200, ש: 300, ת: 400,
  };
  return [...raw].reduce((sum, ch) => sum + (values[ch] ?? 0), 0);
}

export function hebrewParts(date: Date): HebrewParts {
  const parts = hebrewFormat.formatToParts(date);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    day: partToNumber(get("day")),
    month: get("month"),
    year: partToNumber(get("year")),
  };
}

/**
 * השוואת שמות חודשים סלחנית: גרשיים, רווחים כפולים ושתי צורות
 * הכתיב של אדר בשנה מעוברת ("אדר א׳" מול "אדר א") לא אמורים
 * להפיל התאמה שהמנהלת הקלידה ביד בלוח הניהול.
 */
function normalizeMonth(name: string): string {
  return name
    .replace(/[׳״'"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function monthMatches(actual: string, wanted: string): boolean {
  const a = normalizeMonth(actual);
  const w = normalizeMonth(wanted);
  if (a === w) return true;
  // "אדר" סתם, בשנה מעוברת, מתייחס לאדר ב׳ — כך נוהג ההלכה
  // לענייני תאריכים שנתיים, וזה גם מה שמנהלת תתכוון אליו.
  if (w === "אדר" && a === "אדר ב") return true;
  return false;
}

const DAY_MS = 86_400_000;

/** חצות (מקומי) של אותו יום — כדי שהשוואות יהיו ביום שלם */
function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * היום הלועזי שבו מתחילה שנה עברית נתונה (א׳ בתשרי).
 * חיפוש בינארי: השנה העברית עולה מונוטונית עם התאריך הלועזי,
 * ולכן ~11 צעדים מספיקים במקום סריקה של שנתיים.
 */
function startOfHebrewYear(hebrewYear: number): Date {
  // שנה עברית מתחילה בערך בספטמבר של (עברית − 3761)
  let low = startOfDay(new Date(hebrewYear - 3762, 0, 1));
  let high = startOfDay(new Date(hebrewYear - 3760, 11, 31));

  while (high.getTime() - low.getTime() > DAY_MS) {
    const mid = startOfDay(new Date((low.getTime() + high.getTime()) / 2));
    if (hebrewParts(mid).year >= hebrewYear) high = mid;
    else low = mid;
  }

  return high;
}

/**
 * התאריך הלועזי של יום עברי מסוים בשנה עברית מסוימת.
 * null כשאין כזה יום באותה שנה — למשל ל׳ בחשוון בשנה חסרה, או
 * אדר א׳ בשנה פשוטה. זה מצב לגיטימי ולא שגיאה.
 */
export function hebrewToGregorian(
  day: number,
  month: string,
  hebrewYear: number,
): Date | null {
  const cursor = startOfHebrewYear(hebrewYear);

  // שנה עברית מעוברת = 385 יום לכל היותר
  for (let i = 0; i <= 385; i += 1) {
    const candidate = new Date(cursor.getTime() + i * DAY_MS);
    const parts = hebrewParts(candidate);
    if (parts.year !== hebrewYear) break;
    if (parts.day === day && monthMatches(parts.month, month)) {
      return startOfDay(candidate);
    }
  }

  return null;
}

export type Deadline = {
  /** התאריך הלועזי המדויק של המועד */
  date: Date;
  /** האם המועד עוד לא חלף (כולל היום עצמו, עד סופו) */
  active: boolean;
  /** תווית לועזית קצרה לתצוגה לצד התאריך העברי */
  gregorianLabel: string;
};

const gregorianLabelFormat = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * המועד האחרון להטבה, בהינתן יום+חודש עבריים ושנה עברית.
 *
 * hebrewYear = 0 (או שנה שכבר חלפה כשמדובר בברירת מחדל ישנה)
 * פירושו "השנה העברית הנוכחית" — כך הטקסט בלוח הניהול נשאר
 * "כ׳ באלול" בלי שהמנהלת תצטרך להזין שנה, ובכל זאת ההטבה
 * מתייחסת למחזור הנוכחי ולא מתגלגלת לנצח.
 *
 * המועד נחשב פעיל עד *סוף* היום שצוין: מי שנרשם בכ׳ באלול
 * בשמונה בערב עדיין בפנים, כמו שהלקוחה מתכוונת.
 */
export function resolveHebrewDeadline(
  day: number,
  month: string,
  hebrewYear: number,
  now: Date = new Date(),
): Deadline | null {
  const year = hebrewYear > 0 ? hebrewYear : hebrewParts(now).year;
  const date = hebrewToGregorian(day, month, year);
  if (!date) return null;

  const endOfDeadlineDay = new Date(date.getTime() + DAY_MS);

  return {
    date,
    active: now.getTime() < endOfDeadlineDay.getTime(),
    gregorianLabel: gregorianLabelFormat.format(date),
  };
}

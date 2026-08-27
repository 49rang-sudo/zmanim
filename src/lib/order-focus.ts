/* ===============================================================
   תיאום בין כפתורי העמוד לאשף ההזמנה — נקודת כניסה אחת.

   הבעיה שהקובץ הזה פותר, בלשון הלקוחה:
   "קשה להתמקד על מקום ההזמנה, יש הרבה כפתורים שלוקחים אותי לכל
    מיני מקומות", ו"אם אני בוחרת במשבצת ואז רוצה להגדיל חשיפה זה
    מעיף אותי החוצה לעמוד הבית".

   מה שקרה בפועל: כמעט כל כפתורי ה-CTA בעמוד הצביעו ל-#months —
   אזור *התצוגה המקדימה* של החודשים, שיושב 1,270 פיקסלים *מעל*
   אשף ההזמנה (#order). מי שכבר עמד בתוך האשף ולחץ על "לבחירת חודש
   ונוכחות עוגן" (כלומר: רצה להגדיל חשיפה) נזרק כלפי מעלה, אל
   מחוץ לאשף, לאזור השיווקי — וזה נראה בדיוק כמו "חזרה לעמוד
   הבית". הכפתור הדביק בסרגל העליון ובסרגל התחתון במובייל עשה את
   אותו הדבר, והם גלויים *כל* הזמן בזמן ההזמנה.

   שני כללים, וזה כל התיקון:

   1. כפתור שהקופי שלו אומר "לבחור" מוביל לאשף (#order). כפתור
      שהקופי שלו אומר "לראות/לצפות/לבדוק" מוביל לתצוגה המקדימה
      (#months). היעד תמיד תואם למה שכתוב על הכפתור.

   2. ומעל הכול: כשיש הזמנה בתהליך, *כל* הכפתורים האלה מובילים
      לאשף. אין מצב שבו לחיצה על כפתור זורקת מישהי מאמצע ההזמנה
      שלה. זו הליבה של התלונה.

   קישורי התפריט (#pricing, #faq, ...) הם ניווט מפורש ולא CTA —
   הם נשארים קישורי עוגן רגילים ולא עוברים דרך כאן.
   =============================================================== */

import type { PresenceTier } from "@/lib/packages";

/** אזור האשף — נקודת ההזמנה היחידה באתר */
export const ORDER_SECTION_ID = "order";
/** אזור התצוגה המקדימה של החודשים */
export const MONTHS_SECTION_ID = "months";

/** האירוע שנשלח לאשף כשלוחצים על CTA שנושא כוונה (למשל דרגה) */
export const ORDER_INTENT_EVENT = "zmanim:order-intent";

export type OrderIntentDetail = {
  /** הדרגה שהכפתור הבטיח, אם הבטיח — "לבחירת חודש ונוכחות עוגן" */
  tier: PresenceTier | null;
};

/* ---------------------------------------------------------------
   דגל "יש הזמנה בתהליך".

   מודול-סקופ ולא React context: הכפתורים יושבים בעמוד הנחיתה
   (רכיבי שרת) והאשף הוא רכיב לקוח נפרד — אין ביניהם עץ משותף
   שאפשר לתלות בו ספק. הדגל נכתב על ידי האשף בלבד ונקרא רק
   בתוך מטפל לחיצה, כך שאין כאן מצב שמשפיע על רינדור.
   --------------------------------------------------------------- */

let orderInProgress = false;

/** נקרא מהאשף בכל שינוי מצב — "נבחרה עיר / משבצת / נוצרה הזמנה" */
export function setOrderInProgress(active: boolean): void {
  orderInProgress = active;
}

export function isOrderInProgress(): boolean {
  return orderInProgress;
}

/* --------------------------------------------------------------- */

/**
 * גלילה אל אזור בעמוד, בלי ניווט אמיתי.
 *
 * העדכון של ה-hash נעשה ב-replaceState ולא בניווט: ניווט hash
 * היה מוסיף ערך היסטוריה על כל לחיצה (וכפתור "חזרה" שלא באמת
 * חוזר לשום מקום), והגלילה שלו קופצת במקום לזרום. הגלילה עצמה
 * מוחלקת על ידי `html { scroll-behavior: smooth }` שב-globals.css,
 * ולכן היא מכבדת אוטומטית גם prefers-reduced-motion.
 */
export function scrollToSection(id: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;

  target.scrollIntoView({ block: "start" });

  try {
    history.replaceState(null, "", `#${id}`);
  } catch {
    // דפדפן שחוסם replaceState — הגלילה כבר קרתה, וזה העיקר
  }

  return true;
}

/**
 * היעד בפועל של CTA להזמנה. `preferred` הוא היעד שהקופי מבטיח,
 * אבל הזמנה בתהליך גוברת עליו תמיד — ראו כלל 2 למעלה.
 */
export function resolveCtaTarget(preferred: string): string {
  return isOrderInProgress() ? ORDER_SECTION_ID : preferred;
}

/** מודיע לאשף על כוונה שהגיעה מכפתור בעמוד (למשל: דרגת עוגן) */
export function announceOrderIntent(tier: PresenceTier | null): void {
  if (!tier) return;

  window.dispatchEvent(
    new CustomEvent<OrderIntentDetail>(ORDER_INTENT_EVENT, {
      detail: { tier },
    }),
  );
}

/* ===============================================================
   האשף עבר להיות מודל (Dialog) שנפתח על דרישה, במקום קטע קבוע
   בעמוד — ראו OrderModalHost.tsx. מה שהיה בעבר scrollToSection(
   ORDER_SECTION_ID) הופך עכשיו לבקשת-פתיחה של המודל. שני הכללים
   למעלה לא זזו: היעד (resolveCtaTarget) עדיין מחליט *אם* הולכים
   לאשף, וכאן רק משתנה *איך* מגיעים אליו.
   =============================================================== */

/** האירוע שמבקש מ-OrderModalHost לפתוח את מודל ההזמנה */
export const ORDER_OPEN_EVENT = "zmanim:order-open";

export type OrderOpenDetail = {
  /** הדרגה שהכפתור הבטיח, אם הבטיח — מועברת הלאה כאילו הגיעה מ-announceOrderIntent */
  tier: PresenceTier | null;
};

/**
 * מבקש פתיחה של מודל ההזמנה. זהו מה שהחליף את scrollToSection(
 * ORDER_SECTION_ID) — האשף כבר לא יושב בעמוד בתור קטע קבוע.
 * ה-tier (אם יש) מגיע יחד עם הבקשה, וה-host דואג להודיע עליו
 * לאשף (announceOrderIntent) רק אחרי שהאשף בפועל נטען.
 */
export function openOrderModal(tier: PresenceTier | null = null): void {
  window.dispatchEvent(
    new CustomEvent<OrderOpenDetail>(ORDER_OPEN_EVENT, { detail: { tier } }),
  );
}

/**
 * בדיקה חד-פעמית בעליית העמוד: הגענו עם `#order` בכתובת — למשל
 * לחיצה על כפתור הזמנה מעמוד אחר (/receipts, /order/[reference])
 * שאין בו את המודל, ולכן ניווטה לעמוד הבית עם העוגן הישן בכתובת.
 * מנקה את ה-hash מיד (כמו שעשה בעבר scrollToSection), כדי שלא
 * יישאר מצביע למקום שכבר לא קיים בעמוד.
 */
export function consumeOrderHash(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.hash !== `#${ORDER_SECTION_ID}`) return false;

  try {
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  } catch {
    // דפדפן שחוסם replaceState — לא קריטי, פותחים את המודל בכל מקרה
  }

  return true;
}

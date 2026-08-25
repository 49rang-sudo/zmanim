/* ===============================================================
   טיוטת ההזמנה — שמירת הבחירה שבתהליך, כדי שרענון או יציאה
   מקרית לא ימחקו אותה.

   למה בכלל: האשף כולו חי בזיכרון של הדפדפן. עד עכשיו כל דבר
   שגרם לטעינה מחדש של הדף — F5, לחיצה על הלוגו שבסרגל העליון
   (`<a href="/">`, ניווט אמיתי!), חזרה אחורה בדפדפן — מחק את
   העיר, את המשבצת ואת כל מה שהוקלד, והחזיר לשלב 1. במסך זה
   נראה בדיוק כמו "נזרקתי החוצה".

   sessionStorage ולא localStorage, מאותו נימוק בדיוק שכתוב
   ב-src/lib/popup-session.ts: הטיוטה שייכת לביקור הזה. מי
   שחוזר מחר בא לבחור מחדש, לא להמשיך מאמצע משהו ששכח.

   *לא* נשמרות כאן הזמנות שכבר נוצרו (שלבים 4–5). להזמנה שנוצרה
   יש מספר, טוקן והחזקה עם תפוגה בשרת — "שחזור" שלה מהדפדפן היה
   יכול להחיות החזקה שכבר פגה ולהציג מחיר שכבר לא תקף. זה מסלול
   נפרד שדורש אימות מול השרת, ולא נעשה כאן.

   כל גישה עטופה ב-try/catch: בגלישה פרטית חלק מהדפדפנים זורקים
   חריגה על עצם הגישה לאחסון, וטיוטה לא תפיל דף.
   =============================================================== */

import type { MockupSlot } from "@/components/wizard/CalendarMockup";
import type { CityAvailability } from "@/lib/availability";

const DRAFT_KEY = "zmanim:order-draft";

/** גרסה — טיוטה שנשמרה במבנה ישן נזרקת במקום להישבר */
const DRAFT_VERSION = 1;

export type OrderDraft = {
  version: number;
  /** 1–3 בלבד. שלב 4 ומעלה שייך להזמנה שכבר נוצרה בשרת. */
  step: number;
  city: CityAvailability | null;
  viewedEditionId: string | null;
  anchorSlot: MockupSlot | null;
  targetEditionsCount: number | null;
  selections: Record<string, MockupSlot>;
  form: {
    contactName: string;
    businessName: string;
    phone: string;
    email: string;
    monthlyBenefit: string;
    notes: string;
  };
};

/** טיוטה ריקה לגמרי לא שווה שמירה — ולא שווה שחזור */
function isEmpty(draft: OrderDraft): boolean {
  return (
    !draft.city &&
    !draft.anchorSlot &&
    Object.keys(draft.selections).length === 0 &&
    Object.values(draft.form).every((value) => value.trim() === "")
  );
}

export function readOrderDraft(): OrderDraft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as OrderDraft;
    if (parsed?.version !== DRAFT_VERSION) return null;
    if (isEmpty(parsed)) return null;

    // שלב מחוץ לטווח הטיוטה — עדיף להתחיל נקי מאשר לשחזר מסך
    // שהנתונים שלו כבר לא קיימים
    if (!(parsed.step >= 1 && parsed.step <= 3)) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function writeOrderDraft(draft: OrderDraft): void {
  try {
    if (isEmpty(draft)) {
      window.sessionStorage.removeItem(DRAFT_KEY);
      return;
    }
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // אין אחסון — האשף פשוט מתנהג כמו קודם
  }
}

export function clearOrderDraft(): void {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ראו למעלה
  }
}

export { DRAFT_VERSION };

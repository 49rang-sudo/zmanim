import { z } from "zod";
import { env } from "./env";

export type ChargeResult =
  | { ok: true; paymentId: string; documentDownloadUrl?: string }
  | { ok: false; reason: string };

// עטיפת התשובה (Status/UserErrorMessage/TechnicalErrorDetails/Data) אומתה
// מול ה-Schema האמיתי (2026-08-27, מהתיעוד הרשמי - הדוגמה שנמסרה):
//   { "Status": "Success (0)", "UserErrorMessage": "string",
//     "TechnicalErrorDetails": "string", "Data": null }
// כלומר Status הוא מחרוזת בתבנית "שם (קוד)" - 0 = הצלחה. זה שדה ההצלחה/
// כישלון האמיתי והאמין - לא Data.Valid/IsValid שהיה ניחוש קודם.
//
// TODO(sumit): הדוגמה הכללית הזו מציגה Data:null (זו כנראה עטיפת-תשובה
// גנרית המשותפת להרבה endpoints ב-sumit, לא הדוגמה הספציפית לתשובת חיוב
// מוצלחת) - עדיין לא אומת מבנה Data המדויק בתשובת charge מוצלחת בפועל
// (PaymentID/קישור הורדת מסמך וכו'). הפענוח למטה נשאר סלחני לגבי Data
// ומחפש כמה שמות סבירים, עד שתגיע דוגמת תשובה אמיתית עם תשלום שהצליח.
const chargeResponseSchema = z
  .object({
    Status: z.string(),
    UserErrorMessage: z.string().nullable().optional(),
    TechnicalErrorDetails: z.string().nullable().optional(),
    Data: z
      .object({
        Valid: z.boolean().optional(),
        IsValid: z.boolean().optional(),
        PaymentID: z.union([z.string(), z.number()]).optional(),
        ID: z.union([z.string(), z.number()]).optional(),
        StatusDescription: z.string().optional(),
        DocumentDownloadURL: z.string().optional(),
        DocumentDownloadUrl: z.string().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

// "Success (0)" / "SomeError (7)" וכו' - מחלצים את הקוד המספרי ובודקים ==0.
// עמיד יותר מהשוואת-מחרוזת-מלאה אם השם המילולי משתנה בין גרסאות/שפות.
function isSumitStatusSuccess(status: string): boolean {
  const match = status.match(/\((\d+)\)/);
  return match ? Number(match[1]) === 0 : false;
}

/**
 * חיוב בפועל דרך sumit, אחרי שהדפדפן כבר קיבל SingleUseToken חד-פעמי
 * מ-Payments JavaScript API. זו הקריאה הסינכרונית היחידה שקובעת אם
 * התשלום הצליח — אין המתנה ל-webhook.
 *
 * מבנה גוף הבקשה אומת מול ה-Schema האמיתי של POST /billing/payments/charge/
 * (2026-08-27, מהתיעוד הרשמי) - התיקון המהותי היחיד מול הניחוש הקודם:
 * Items הוא מערך של { Item: {Name,...}, Quantity, UnitPrice } ולא { Name, Price }
 * שטוח - המחיר בפועל הוא UnitPrice ברמת השורה, לא Item.Price (זה כנראה מחיר
 * קטלוג/ברירת מחדל). Credentials/Customer/SingleUseToken כבר תאמו לניחוש המקורי.
 * PaymentMethod (מספר כרטיס גולמי) לא נשלח בכלל - זו חלופה ל-SingleUseToken,
 * לא נדרשת בזרימה שלנו שכבר מטוקניזת בצד הלקוח.
 *
 * TODO(sumit): גוף התשובה (Response) עדיין לא אומת מול Schema אמיתי - עדיין
 * ממתינים לדוגמת תשובה אמיתית (הצלחה/כישלון) מהתיעוד לפני שאפשר לצמצם את
 * chargeResponseSchema הסלחני למטה לסכמה מדויקת.
 */
export async function chargeSumit(input: {
  singleUseToken: string;
  customer: { name: string; phone: string; email: string };
  item: { name: string; priceShekels: number };
}): Promise<ChargeResult> {
  const e = env();

  if (!e.SUMIT_COMPANY_ID || !e.SUMIT_API_KEY) {
    console.error("[sumit] SUMIT_COMPANY_ID/SUMIT_API_KEY לא מוגדרים");
    return {
      ok: false,
      reason: "הסליקה עדיין לא הוגדרה באתר. נא לפנות למנהל המערכת.",
    };
  }

  const url = `${e.SUMIT_API_BASE_URL.replace(/\/$/, "")}/billing/payments/charge/`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        Credentials: { CompanyID: e.SUMIT_COMPANY_ID, APIKey: e.SUMIT_API_KEY },
        Customer: {
          Name: input.customer.name,
          Phone: input.customer.phone,
          EmailAddress: input.customer.email,
        },
        Items: [
          {
            Item: { Name: input.item.name },
            Quantity: 1,
            UnitPrice: input.item.priceShekels,
          },
        ],
        SingleUseToken: input.singleUseToken,
      }),
    });
  } catch (error) {
    console.error("[sumit] שגיאת רשת בקריאת חיוב:", error);
    return { ok: false, reason: "תקשורת עם ספק הסליקה נכשלה. נסו שוב." };
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    console.error(`[sumit] תשובה לא תקינה (HTTP ${res.status}) מ-charge`);
    return { ok: false, reason: "תשובה לא תקינה מספק הסליקה." };
  }

  const parsed = chargeResponseSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("[sumit] תשובה לא צפויה מ-charge:", payload);
    return { ok: false, reason: "תשובה לא צפויה מספק הסליקה." };
  }

  const data = parsed.data.Data;
  const succeeded = isSumitStatusSuccess(parsed.data.Status);
  const paymentId = data?.PaymentID ?? data?.ID;

  if (!res.ok || !succeeded) {
    console.error(`[sumit] חיוב נדחה (HTTP ${res.status}, Status=${parsed.data.Status}):`, payload);
    const reason =
      parsed.data.UserErrorMessage || data?.StatusDescription || parsed.data.Status || "התשלום נדחה";
    return { ok: false, reason };
  }

  // Status מדווח הצלחה אבל אין מזהה תשלום ב-Data - מצב לא צפוי (ראו TODO
  // למעלה על Data עוד לא מאומת) - עדיף לדווח כישלון מאשר "להצליח" בלי
  // paymentId אמיתי לשמור/להציג.
  if (!paymentId) {
    console.error("[sumit] Status מדווח הצלחה אבל אין PaymentID ב-Data:", payload);
    return { ok: false, reason: "התשלום עבר אך לא התקבל אישור מלא. נא לפנות לבדיקה." };
  }

  return {
    ok: true,
    paymentId: String(paymentId),
    documentDownloadUrl: data?.DocumentDownloadURL ?? data?.DocumentDownloadUrl,
  };
}

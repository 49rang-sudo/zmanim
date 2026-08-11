import { z } from "zod";
import { env } from "./env";

export type ChargeResult =
  | { ok: true; paymentId: string; documentDownloadUrl?: string }
  | { ok: false; reason: string };

// TODO(sumit): שמות השדות בתשובה לא מאושרים במלואם מול תיעוד sumit —
// רק ה"בקיצור" שנמסר (Status, Data.PaymentID/DocumentID/קישור הורדה,
// "האם התשלום תקין"). לכן הסכמה כאן סלחנית (אופציונלי + passthrough)
// ומכסה כמה שמות סבירים לכל שדה — יש לצמצם ולאמת מול ה-Schema האמיתי
// לפני שהאתר גובה כסף אמיתי.
const chargeResponseSchema = z
  .object({
    Status: z.string().optional(),
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
      .optional(),
  })
  .passthrough();

/**
 * חיוב בפועל דרך sumit, אחרי שהדפדפן כבר קיבל SingleUseToken חד-פעמי
 * מ-Payments JavaScript API. זו הקריאה הסינכרונית היחידה שקובעת אם
 * התשלום הצליח — אין המתנה ל-webhook.
 *
 * TODO(sumit): לאמת מול לוח הבקרה של sumit את כתובת ה-API (SUMIT_API_BASE_URL)
 * ואת הנתיב המדויק לפני production.
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
        Items: [{ Name: input.item.name, Price: input.item.priceShekels }],
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
  const valid = data?.Valid ?? data?.IsValid ?? false;
  const paymentId = data?.PaymentID ?? data?.ID;

  if (!res.ok || !valid || !paymentId) {
    console.error(`[sumit] חיוב נדחה (HTTP ${res.status}):`, payload);
    const reason = data?.StatusDescription ?? parsed.data.Status ?? "התשלום נדחה";
    return { ok: false, reason };
  }

  return {
    ok: true,
    paymentId: String(paymentId),
    documentDownloadUrl: data?.DocumentDownloadURL ?? data?.DocumentDownloadUrl,
  };
}

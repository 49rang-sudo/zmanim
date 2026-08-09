import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";
import { confirmReservation } from "./availability";

/**
 * חתימת HMAC על גוף ה-webhook.
 * ספק הסליקה חותם באותו סוד משותף; אנחנו מחשבים מחדש ומשווים.
 */
export function signPayload(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

export function verifySignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;

  const expected = signPayload(rawBody, secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type PaymentResult =
  | { ok: true; alreadyPaid: boolean; orderId: string; overbooked?: boolean }
  | {
      ok: false;
      reason: "ORDER_NOT_FOUND" | "AMOUNT_MISMATCH" | "ORDER_CANCELLED";
    };

/**
 * מסמן הזמנה כמשולמת והופך את ההחזקה הזמנית לתפיסה קבועה.
 *
 * אידמפוטנטי: קריאה חוזרת על הזמנה ששולמה מחזירה הצלחה בלי
 * לשנות דבר — ספקי סליקה שולחים webhook יותר מפעם אחת.
 */
export async function markOrderPaid(
  reference: string,
  paymentRef: string,
  provider: string,
  paidAmountAgorot?: number,
): Promise<PaymentResult> {
  const order = await prisma.order.findUnique({ where: { reference } });

  if (!order) return { ok: false, reason: "ORDER_NOT_FOUND" };

  if (order.status === "PAID") {
    return { ok: true, alreadyPaid: true, orderId: order.id };
  }

  // ביטול ידני הוא החלטה מפורשת של מנהל — תשלום שמגיע אחריו
  // (webhook מאוחר, למשל) לא יכול להפוך אותה בשקט. דורש טיפול ידני.
  if (order.status === "CANCELLED") {
    console.error(
      `[payments] תשלום התקבל להזמנה מבוטלת ${reference} — נדרש טיפול ידני`,
    );
    return { ok: false, reason: "ORDER_CANCELLED" };
  }

  // הגנה מפני תשלום בסכום שאינו תואם למה שהוזמן
  if (
    typeof paidAmountAgorot === "number" &&
    paidAmountAgorot !== order.priceAgorot
  ) {
    console.error(
      `[payments] אי-התאמה בסכום להזמנה ${reference}: ` +
        `צפוי ${order.priceAgorot}, התקבל ${paidAmountAgorot}`,
    );
    return { ok: false, reason: "AMOUNT_MISMATCH" };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paymentRef,
      paymentProvider: provider,
    },
  });

  // מרגע התשלום המשבצת תפוסה לצמיתות ולא משתחררת בפקיעת החזקה
  const reservation = await confirmReservation(
    order.id,
    order.cityId,
    order.slotId,
  );

  if (!reservation.ok) {
    // התשלום כבר בוצע ולא ניתן "לבטל" אותו כאן — אבל אין יותר
    // מקום בעיר (ההחזקה פגה וההזדמנות נתפסה על ידי הזמנה אחרת).
    // חובה לסמן לטיפול ידני (החזר/עיר חלופית) ולא להשאיר את זה בשקט.
    const alert =
      "⚠ שולם, אך ההחזקה במהדורה כבר פגה והמכסה מלאה — נדרש טיפול ידני (החזר/עיר חלופית).";
    await prisma.order.update({
      where: { id: order.id },
      data: {
        adminNotes: order.adminNotes ? `${order.adminNotes}\n\n${alert}` : alert,
      },
    });
    console.error(
      `[payments] הזמנה ${reference} שולמה אך העיר מלאה — נדרש טיפול ידני`,
    );
  }

  return {
    ok: true,
    alreadyPaid: false,
    orderId: order.id,
    overbooked: !reservation.ok,
  };
}

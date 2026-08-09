import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { markOrderPaid, verifySignature } from "@/lib/payments";
import { fail, handle, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eventSchema = z.object({
  /** מזהה ייחודי של האירוע אצל הספק — בסיס לאידמפוטנטיות */
  eventId: z.string().min(1),
  /** מזהה ההזמנה שלנו, כפי שהועבר לספק בקישור הסליקה */
  reference: z.string().min(1),
  status: z.enum(["paid", "failed", "refunded", "pending"]),
  /** סכום ששולם, בשקלים */
  amount: z.coerce.number().nonnegative().optional(),
  paymentRef: z.string().optional(),
});

/**
 * POST /api/payments/webhook
 *
 * זהו מקור האמת היחיד לתשלום. חזרת הדפדפן מהסליקה היא רק חוויית
 * משתמש — לעולם לא מסמנים "שולם" על סמך redirect שהלקוח שולט בו.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const secret = env().PAYMENT_WEBHOOK_SECRET;

    // חייבים את הגוף הגולמי — כל עיבוד מקדים ישבור את החתימה
    const rawBody = await request.text();

    const signature =
      request.headers.get("x-signature") ??
      request.headers.get("x-webhook-signature");

    if (!verifySignature(rawBody, signature, secret)) {
      console.error("[webhook] חתימה שגויה נדחתה");
      return fail(401, "BAD_SIGNATURE", "חתימה שגויה");
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return fail(400, "INVALID_JSON", "גוף הבקשה אינו JSON תקין");
    }

    const parsed = eventSchema.safeParse(payload);
    if (!parsed.success) {
      return fail(422, "VALIDATION_FAILED", parsed.error.issues[0].message);
    }

    const event = parsed.data;
    const provider = env().PAYMENT_PROVIDER;

    // אידמפוטנטיות: אם האירוע כבר נקלט, לא מעבדים אותו שוב.
    // ה-@@unique על (provider, eventId) הוא מה שמונע מרוץ אמיתי.
    try {
      await prisma.webhookEvent.create({
        data: {
          provider,
          eventId: event.eventId,
          orderRef: event.reference,
          payload: payload as object,
        },
      });
    } catch {
      console.log(`[webhook] אירוע כפול ${event.eventId} — דולג`);
      return ok({ received: true, duplicate: true });
    }

    if (event.status !== "paid") {
      await prisma.webhookEvent.updateMany({
        where: { provider, eventId: event.eventId },
        data: { processed: true },
      });
      return ok({ received: true, ignored: event.status });
    }

    const result = await markOrderPaid(
      event.reference,
      event.paymentRef ?? event.eventId,
      provider,
      typeof event.amount === "number"
        ? Math.round(event.amount * 100)
        : undefined,
    );

    await prisma.webhookEvent.updateMany({
      where: { provider, eventId: event.eventId },
      data: {
        processed: result.ok,
        error: result.ok ? null : result.reason,
      },
    });

    if (!result.ok) {
      // מחזירים 200 בכוונה: הבעיה אצלנו בנתונים, ואין טעם
      // שהספק ינסה שוב ושוב. השגיאה נשמרה בלוג האירועים.
      console.error(
        `[webhook] עיבוד נכשל עבור ${event.reference}: ${result.reason}`,
      );
      return ok({ received: true, processed: false, reason: result.reason });
    }

    return ok({ received: true, processed: true });
  });
}

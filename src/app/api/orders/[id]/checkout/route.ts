import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { extractOrderToken, findOrderByToken, isEditable } from "@/lib/orders";
import { fail, handle, notFound, ok } from "@/lib/api";

export const runtime = "nodejs";

/**
 * POST /api/orders/:id/checkout
 * מייצר את קישור הסליקה החיצוני המשויך ל-SKU של המשבצת,
 * ומעביר את ההזמנה למצב "ממתינה לתשלום".
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const order = await findOrderByToken(id, extractOrderToken(request));

    if (!order) return notFound("ההזמנה");

    if (order.status === "PAID") {
      return fail(409, "ALREADY_PAID", "ההזמנה כבר שולמה");
    }

    if (!isEditable(order.status)) {
      return fail(409, "ORDER_LOCKED", "ההזמנה אינה פעילה יותר");
    }

    if (!order.fileKey) {
      return fail(
        409,
        "FILE_REQUIRED",
        "יש להעלות קובץ להדפסה לפני המעבר לתשלום",
      );
    }

    if (
      order.reservation?.expiresAt &&
      order.reservation.expiresAt.getTime() < Date.now()
    ) {
      return fail(
        409,
        "HOLD_EXPIRED",
        "זמן שמירת המשבצת הסתיים. יש להתחיל הזמנה מחדש.",
      );
    }

    const e = env();
    const base = e.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
    // הטוקן לא נשלח לספק הסליקה — הלקוח מחזיק אותו מקומית
    const returnUrl = `${base}/order/${order.reference}`;

    let checkoutUrl: string;

    if (order.slot.checkoutUrl) {
      // קישור סליקה אמיתי שהוגדר בלוח הניהול עבור ה-SKU הזה
      const url = new URL(order.slot.checkoutUrl);
      url.searchParams.set("ref", order.reference);
      url.searchParams.set("amount", (order.priceAgorot / 100).toFixed(2));
      url.searchParams.set("redirect", returnUrl);
      checkoutUrl = url.toString();
    } else {
      // לא הוגדר קישור ל-SKU — נופלים לעמוד סליקת הדגמה מקומי,
      // כדי שהתהליך יהיה בדיק מקצה לקצה לפני חיבור ספק אמיתי.
      const url = new URL(`${base}/checkout/demo`);
      url.searchParams.set("ref", order.reference);
      checkoutUrl = url.toString();
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "AWAITING_PAYMENT",
        checkoutUrl,
        paymentProvider: order.slot.checkoutUrl ? e.PAYMENT_PROVIDER : "demo",
      },
    });

    return ok({
      checkoutUrl,
      isDemo: !order.slot.checkoutUrl,
      reference: order.reference,
    });
  });
}

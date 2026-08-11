import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { extractOrderToken, findOrderByToken, isEditable } from "@/lib/orders";
import { markOrderPaid } from "@/lib/payments";
import { chargeSumit } from "@/lib/sumit";
import { fail, handle, notFound, ok, parseBody } from "@/lib/api";

export const runtime = "nodejs";

const schema = z.object({ singleUseToken: z.string().min(1) });

/**
 * POST /api/orders/:id/charge
 *
 * מחייב בפועל דרך sumit: הדפדפן כבר החליף את פרטי האשראי בטוקן
 * חד-פעמי (Payments JavaScript API), והראוט הזה שולח אותו ל-Charge
 * API מהשרת. בניגוד למנגנון הקודם — אין redirect לספק חיצוני ואין
 * המתנה ל-webhook, התשובה מגיעה סינכרונית מ-sumit.
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
      order.reservations.some(
        (r) => r.expiresAt && r.expiresAt.getTime() < Date.now(),
      )
    ) {
      return fail(
        409,
        "HOLD_EXPIRED",
        "זמן שמירת המשבצת הסתיים. יש להתחיל הזמנה מחדש.",
      );
    }

    const body = await parseBody(request, schema);
    if (!body.ok) return body.response;

    // מסמן ניסיון חיוב בתהליך — לצורך שקיפות אם הקריאה ל-sumit נתקעת
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "AWAITING_PAYMENT" },
    });

    const result = await chargeSumit({
      singleUseToken: body.data.singleUseToken,
      customer: {
        name: order.contactName,
        phone: order.phone,
        email: order.email,
      },
      item: { name: order.slot.name, priceShekels: order.priceAgorot / 100 },
    });

    if (!result.ok) {
      // ההזמנה נשארת AWAITING_PAYMENT — עדיין ניתנת לעריכה, הלקוח יכול
      // לנסות כרטיס אחר בלי להתחיל את כל התהליך מחדש.
      return fail(402, "CHARGE_DECLINED", result.reason);
    }

    const paid = await markOrderPaid(
      order.reference,
      result.paymentId,
      "sumit",
      order.priceAgorot,
    );

    if (!paid.ok) {
      return fail(409, paid.reason, "התשלום בוצע אך לא ניתן היה לעדכן את ההזמנה");
    }

    return ok({ paid: true, alreadyPaid: paid.alreadyPaid });
  });
}

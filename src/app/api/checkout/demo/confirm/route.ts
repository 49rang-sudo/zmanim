import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/payments";
import { fail, handle, notFound, ok, parseBody } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ reference: z.string().min(3) });

/**
 * POST /api/checkout/demo/confirm
 *
 * מדמה אישור תשלום של ספק סליקה, כדי שאפשר יהיה לבדוק את התהליך
 * מקצה לקצה לפני חיבור ספק אמיתי.
 *
 * פועל אך ורק על הזמנות שסומנו כ-demo — כלומר כאלה של-SKU שלהן
 * לא הוגדר קישור סליקה. ברגע שמוגדר קישור אמיתי, המסלול הזה
 * מסרב לטפל בהזמנה והתשלום חייב לעבור דרך ה-webhook החתום.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(
      `demo-pay:${clientIp(request.headers)}`,
      20,
      10 * 60 * 1000,
    );
    if (!limit.ok) {
      return fail(429, "RATE_LIMITED", "יותר מדי בקשות");
    }

    const body = await parseBody(request, schema);
    if (!body.ok) return body.response;

    const order = await prisma.order.findUnique({
      where: { reference: body.data.reference },
      select: { id: true, paymentProvider: true, status: true },
    });

    if (!order) return notFound("ההזמנה");

    if (order.paymentProvider !== "demo") {
      return fail(
        403,
        "NOT_DEMO_ORDER",
        "ההזמנה מחוברת לספק סליקה אמיתי. אישור התשלום חייב להגיע מהספק.",
      );
    }

    const result = await markOrderPaid(
      body.data.reference,
      `demo-${Date.now()}`,
      "demo",
    );

    if (!result.ok) {
      return fail(409, result.reason, "לא ניתן היה לסמן את ההזמנה כמשולמת");
    }

    return ok({ paid: true, alreadyPaid: result.alreadyPaid });
  });
}

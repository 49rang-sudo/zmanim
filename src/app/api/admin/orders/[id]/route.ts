import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  confirmReservation,
  releaseReservation,
  type SlotSelection,
} from "@/lib/availability";
import { resolveOrderSelections } from "@/lib/orders";
import { fail, handle, notFound, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z
    .enum(["PENDING", "AWAITING_PAYMENT", "PAID", "CANCELLED", "EXPIRED"])
    .optional(),
  adminNotes: z.string().max(4000).optional().nullable(),
});

/** PATCH /api/admin/orders/:id — עדכון סטטוס והערות פנימיות */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const { id } = await params;
    const body = await parseBody(request, patchSchema);
    if (!body.ok) return body.response;

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return notFound("ההזמנה");

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(body.data.status ? { status: body.data.status } : {}),
        ...(body.data.adminNotes !== undefined
          ? { adminNotes: body.data.adminNotes }
          : {}),
        ...(body.data.status === "PAID" && !existing.paidAt
          ? { paidAt: new Date() }
          : {}),
      },
    });

    // שינוי סטטוס חייב לגרור את המשבצת אחריו, אחרת המלאי משקר
    if (body.data.status === "PAID") {
      const reservation = await confirmReservation(
        id,
        existing.cityId,
        existing.selections as SlotSelection[],
      );
      if (!reservation.ok) {
        const alert = `⚠ סומן כשולם, אך אין מקום פנוי במהדורות: ${reservation.failedEditionIds.join(", ")} — נדרש טיפול ידני (החזר חלקי/מהדורה חלופית).`;
        await prisma.order.update({
          where: { id },
          data: {
            adminNotes: order.adminNotes
              ? `${order.adminNotes}\n\n${alert}`
              : alert,
          },
        });
      }
    } else if (
      body.data.status === "CANCELLED" ||
      body.data.status === "EXPIRED"
    ) {
      await releaseReservation(id);
    }

    return ok({ order });
  });
}

/** GET /api/admin/orders/:id — הזמנה בודדת עם כל הפרטים */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { slot: true, city: true, reservations: true },
    });

    if (!order) return notFound("ההזמנה");

    const detailsMap = await resolveOrderSelections([
      { id: order.id, selections: order.selections },
    ]);

    // הטוקן של הלקוח לא נחשף גם למנהל דרך ה-API
    const { accessToken: _token, ...safe } = order;
    return ok({
      order: { ...safe, selectionDetails: detailsMap.get(order.id) ?? [] },
    });
  });
}

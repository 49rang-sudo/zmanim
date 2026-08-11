import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, notFound, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

const patchEditionSchema = z.object({
  hebrewLabel: z.string().trim().min(1).max(60).optional(),
  capacity: z.coerce.number().int().min(1).max(200).optional(),
  closesAt: z.coerce.date().optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  marketingNote: z.string().trim().max(400).optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const { id } = await params;
    const body = await parseBody(request, patchEditionSchema);
    if (!body.ok) return body.response;

    const existing = await prisma.edition.findUnique({
      where: { id },
      include: { _count: { select: { reservations: true } } },
    });
    if (!existing) return notFound("המהדורה");

    // הורדת קיבולת מתחת למה שכבר נמכר תיצור מלאי שלילי
    if (
      body.data.capacity !== undefined &&
      body.data.capacity < existing._count.reservations
    ) {
      return fail(
        409,
        "CAPACITY_BELOW_SOLD",
        `כבר נתפסו ${existing._count.reservations} משבצות במהדורה הזו. ` +
          `לא ניתן לקבוע קיבולת נמוכה מזה.`,
      );
    }

    const edition = await prisma.edition.update({
      where: { id },
      data: body.data,
    });

    return ok({ edition });
  });
}

/**
 * DELETE /api/admin/editions/:id
 * מחיקה נחסמת אם כבר יש תפיסות (זמניות או קבועות) במהדורה — כדי
 * לא לאבד תיעוד של הזמנות שכבר תלויות בה.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const { id } = await params;

    const edition = await prisma.edition.findUnique({
      where: { id },
      include: { _count: { select: { reservations: true } } },
    });
    if (!edition) return notFound("המהדורה");

    if (edition._count.reservations > 0) {
      return fail(
        409,
        "EDITION_HAS_RESERVATIONS",
        `למהדורה הזו יש ${edition._count.reservations} תפיסות. ` +
          `אי אפשר למחוק אותה — אפשר לסגור אותה במקום.`,
      );
    }

    await prisma.edition.delete({ where: { id } });
    return ok({ deleted: true });
  });
}

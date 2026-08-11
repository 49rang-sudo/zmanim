import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { fail, handle, notFound, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

const patchCitySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  region: z.string().trim().max(80).optional().nullable(),
  capacity: z.coerce.number().int().min(1).max(200).optional(),
  distribution: z.coerce.number().int().min(0).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
  visible: z.boolean().optional(),
  autoHideWhenFull: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const { id } = await params;
    const body = await parseBody(request, patchCitySchema);
    if (!body.ok) return body.response;

    const existing = await prisma.city.findUnique({ where: { id } });
    if (!existing) return notFound("העיר");

    const city = await prisma.city.update({
      where: { id },
      data: {
        ...body.data,
        ...(body.data.name ? { slug: slugify(body.data.name) } : {}),
      },
    });

    return ok({ city });
  });
}

/**
 * DELETE /api/admin/cities/:id
 * מחיקה נחסמת אם יש הזמנות היסטוריות — במקרה כזה מסתירים את העיר
 * במקום למחוק, כדי לא לאבד תיעוד.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const { id } = await params;

    const city = await prisma.city.findUnique({
      where: { id },
      include: { _count: { select: { orders: true, editions: true } } },
    });

    if (!city) return notFound("העיר");

    if (city._count.orders > 0) {
      return fail(
        409,
        "CITY_HAS_ORDERS",
        `לעיר ${city.name} יש ${city._count.orders} הזמנות. ` +
          `אי אפשר למחוק אותה — אפשר להסתיר אותה מהבורר.`,
      );
    }

    if (city._count.editions > 0) {
      return fail(
        409,
        "CITY_HAS_EDITIONS",
        `לעיר ${city.name} יש ${city._count.editions} מהדורות. ` +
          `יש למחוק אותן קודם.`,
      );
    }

    await prisma.city.delete({ where: { id } });
    return ok({ deleted: true });
  });
}

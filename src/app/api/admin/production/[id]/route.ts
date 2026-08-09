import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, notFound, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

const patchSchema = z.object({
  productionStatus: z.enum(["WAITING", "HANDLED"]).optional(),
  productionNote: z.string().max(2000).optional().nullable(),
});

/**
 * PATCH /api/admin/production/:id
 * החזרה ידנית ל"ממתין" (למשל אם הקובץ נמצא פגום אחרי ההורדה),
 * או סימון ידני כטופל בלי להוריד.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();

    const { id } = await params;
    const body = await parseBody(request, patchSchema);
    if (!body.ok) return body.response;

    const existing = await prisma.order.findUnique({
      where: { id },
      select: { id: true, artworkDownloadedAt: true },
    });
    if (!existing) return notFound("ההזמנה");

    const next = body.data.productionStatus;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(next ? { productionStatus: next } : {}),
        ...(body.data.productionNote !== undefined
          ? { productionNote: body.data.productionNote }
          : {}),
        // סימון ידני כטופל בלי הורדה — עדיין מתעד מי ומתי
        ...(next === "HANDLED" && !existing.artworkDownloadedAt
          ? {
              artworkDownloadedAt: new Date(),
              artworkDownloadedBy: admin.email ?? admin.id,
            }
          : {}),
      },
      select: { id: true, productionStatus: true, productionNote: true },
    });

    return ok({ order });
  });
}

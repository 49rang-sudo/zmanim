import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, ok, unauthorized } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/slots — כל הגדלים, כולל לא-פעילים.
 * soldCount = כמה הזמנות בחרו את הגודל הזה. אין "מלאי" לגודל:
 * המלאי נספר ברמת העיר בלבד.
 */
export async function GET() {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const [slots, sold] = await Promise.all([
      prisma.adSlot.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.slotReservation.groupBy({
        by: ["slotId"],
        _count: { _all: true },
      }),
    ]);

    const soldById = new Map(sold.map((s) => [s.slotId, s._count._all]));

    return ok({
      slots: slots.map((slot) => ({
        ...slot,
        soldCount: soldById.get(slot.id) ?? 0,
      })),
    });
  });
}

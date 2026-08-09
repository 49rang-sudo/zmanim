import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, ok, unauthorized } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/production?cityId=...
 *
 * סביבת העבודה של הגרפיקאית.
 * מוחזרות רק הזמנות ששולמו ושיש להן קובץ — הזמנה בלי תשלום
 * או בלי אמנות אינה עבודה גרפית ולכן לא מופיעה כאן כלל.
 */
export async function GET(request: Request) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const cityId = new URL(request.url).searchParams.get("cityId");

    const baseWhere = {
      status: "PAID" as const,
      fileKey: { not: null },
      ...(cityId && cityId !== "ALL" ? { cityId } : {}),
    };

    const select = {
      id: true,
      reference: true,
      sku: true,
      contactName: true,
      businessName: true,
      phone: true,
      email: true,
      notes: true,
      fileName: true,
      fileSize: true,
      fileUploadedAt: true,
      productionStatus: true,
      productionNote: true,
      artworkDownloadedAt: true,
      artworkDownloadedBy: true,
      paidAt: true,
      slot: {
        select: { name: true, widthCm: true, heightCm: true },
      },
      city: { select: { id: true, name: true } },
    };

    const [waiting, handled, cities] = await Promise.all([
      prisma.order.findMany({
        where: { ...baseWhere, productionStatus: "WAITING" },
        orderBy: { paidAt: "asc" }, // הוותיקה ביותר קודם
        select,
      }),
      prisma.order.findMany({
        where: { ...baseWhere, productionStatus: "HANDLED" },
        orderBy: { artworkDownloadedAt: "desc" },
        take: 100,
        select,
      }),
      // ספירת עבודה פתוחה לכל עיר — כדי שאפשר יהיה לבחור עיר
      // ולראות מיד כמה ממתין בה
      prisma.order.groupBy({
        by: ["cityId"],
        where: { status: "PAID", fileKey: { not: null }, productionStatus: "WAITING" },
        _count: { _all: true },
      }),
    ]);

    const cityNames = await prisma.city.findMany({
      select: { id: true, name: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const waitingByCity = new Map(cities.map((c) => [c.cityId, c._count._all]));

    return ok({
      waiting,
      handled,
      cities: cityNames.map((c) => ({
        ...c,
        waitingCount: waitingByCity.get(c.id) ?? 0,
      })),
      totals: {
        waiting: waiting.length,
        handled: handled.length,
      },
    });
  });
}

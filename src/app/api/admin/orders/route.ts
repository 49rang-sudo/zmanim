import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { releaseExpiredHolds } from "@/lib/availability";
import { resolveOrderSelections } from "@/lib/orders";
import { handle, ok, unauthorized } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/orders?status=&cityId=&q=&page= */
export async function GET(request: Request) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    await releaseExpiredHolds();

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const cityId = url.searchParams.get("cityId");
    const q = url.searchParams.get("q")?.trim();
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = 25;

    const where = {
      ...(status && status !== "ALL"
        ? { status: status as "PENDING" }
        : {}),
      ...(cityId ? { cityId } : {}),
      ...(q
        ? {
            OR: [
              { reference: { contains: q, mode: "insensitive" as const } },
              { contactName: { contains: q, mode: "insensitive" as const } },
              { businessName: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    };

    const [orders, total, counts] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          slot: { select: { name: true, sku: true, widthCm: true, heightCm: true } },
          city: { select: { name: true } },
          reservations: { select: { expiresAt: true } },
        },
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const detailsMap = await resolveOrderSelections(
      orders.map((o) => ({ id: o.id, selections: o.selections })),
    );
    const ordersWithSelections = orders.map((o) => ({
      ...o,
      selectionDetails: detailsMap.get(o.id) ?? [],
    }));

    return ok({
      orders: ordersWithSelections,
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      counts: Object.fromEntries(
        counts.map((c) => [c.status, c._count._all]),
      ),
    });
  });
}

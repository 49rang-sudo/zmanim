import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { releaseExpiredHolds } from "@/lib/availability";
import { handle, ok, unauthorized } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Range = "7d" | "30d" | "90d" | "12m" | "all";

const RANGE_DAYS: Record<Exclude<Range, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
};

/** גודל דלי מותאם לטווח — 7 ימים ביומי, שנה בחודשי */
function bucketFor(range: Range): "day" | "week" | "month" {
  if (range === "7d" || range === "30d") return "day";
  if (range === "90d") return "week";
  return "month";
}

function bucketKey(date: Date, bucket: "day" | "week" | "month"): string {
  const d = new Date(date);
  if (bucket === "month") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  if (bucket === "week") {
    // תחילת השבוע ביום ראשון, כמקובל בלוח העברי
    d.setDate(d.getDate() - d.getDay());
  }
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/** שרשרת דליים רציפה — בלי זה "אין מכירות" נראה כמו קפיצה בזמן */
function emptyBuckets(from: Date, to: Date, bucket: "day" | "week" | "month") {
  const keys: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= to) {
    keys.push(bucketKey(cursor, bucket));
    if (bucket === "month") cursor.setMonth(cursor.getMonth() + 1);
    else if (bucket === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
  }

  return [...new Set(keys)];
}

export async function GET(request: Request) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    await releaseExpiredHolds();

    const url = new URL(request.url);
    const range = (url.searchParams.get("range") ?? "30d") as Range;

    const now = new Date();
    const from =
      range === "all"
        ? new Date(2020, 0, 1)
        : new Date(now.getTime() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000);

    const bucket = bucketFor(range);

    const [paidInRange, openOrders, cities, openEditions, allPaid] =
      await Promise.all([
        prisma.order.findMany({
          where: { status: "PAID", paidAt: { gte: from, lte: now } },
          select: {
            priceAgorot: true,
            paidAt: true,
            cityId: true,
            sku: true,
            slot: { select: { name: true } },
            city: { select: { name: true } },
          },
        }),
        prisma.order.count({
          where: { status: { in: ["PENDING", "AWAITING_PAYMENT"] } },
        }),
        prisma.city.findMany({
          select: { id: true, name: true, visible: true },
        }),
        // תפוסה/קיבולת נמדדות עכשיו ברמת המהדורה הפתוחה, לא ברמת
        // העיר — תואם ל-totalCapacity שמסתכם רק מערים גלויות, אחרת
        // אחוז התפוסה משווה מונה ומכנה מתחומים שונים ויכול לחרוג מ-100%
        prisma.edition.findMany({
          where: { status: "OPEN", city: { visible: true } },
          select: { id: true, cityId: true, capacity: true },
        }),
        prisma.order.aggregate({
          where: { status: "PAID" },
          _sum: { priceAgorot: true },
          _count: { _all: true },
        }),
      ]);

    const occupied = await prisma.slotReservation.count({
      where: { editionId: { in: openEditions.map((e) => e.id) } },
    });
    const capacityByCity = new Map<string, number>();
    for (const edition of openEditions) {
      capacityByCity.set(
        edition.cityId,
        (capacityByCity.get(edition.cityId) ?? 0) + edition.capacity,
      );
    }

    // --- מדדים ראשיים ---
    const revenue = paidInRange.reduce((sum, o) => sum + o.priceAgorot, 0);
    const orderCount = paidInRange.length;

    const totalCapacity = openEditions.reduce((sum, e) => sum + e.capacity, 0);

    // --- מכירות לאורך זמן ---
    const seriesMap = new Map<string, { revenue: number; count: number }>();
    for (const key of emptyBuckets(from, now, bucket)) {
      seriesMap.set(key, { revenue: 0, count: 0 });
    }
    for (const order of paidInRange) {
      if (!order.paidAt) continue;
      const key = bucketKey(order.paidAt, bucket);
      const entry = seriesMap.get(key) ?? { revenue: 0, count: 0 };
      entry.revenue += order.priceAgorot;
      entry.count += 1;
      seriesMap.set(key, entry);
    }

    const overTime = [...seriesMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ key, ...value }));

    // --- לפי עיר ---
    const cityMap = new Map<string, { revenue: number; count: number }>();
    for (const order of paidInRange) {
      const entry = cityMap.get(order.city.name) ?? { revenue: 0, count: 0 };
      entry.revenue += order.priceAgorot;
      entry.count += 1;
      cityMap.set(order.city.name, entry);
    }

    const byCity = cities
      .map((city) => ({
        name: city.name,
        capacity: capacityByCity.get(city.id) ?? 0,
        revenue: cityMap.get(city.name)?.revenue ?? 0,
        count: cityMap.get(city.name)?.count ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue || b.count - a.count);

    // --- משבצות מובילות ---
    const slotMap = new Map<string, { name: string; revenue: number; count: number }>();
    for (const order of paidInRange) {
      const entry = slotMap.get(order.sku) ?? {
        name: order.slot.name,
        revenue: 0,
        count: 0,
      };
      entry.revenue += order.priceAgorot;
      entry.count += 1;
      slotMap.set(order.sku, entry);
    }

    const topSlots = [...slotMap.entries()]
      .map(([sku, value]) => ({ sku, ...value }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    return ok({
      range,
      bucket,
      kpis: {
        revenue,
        orderCount,
        avgOrder: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
        openOrders,
        occupied,
        totalCapacity,
        occupancyPct:
          totalCapacity > 0
            ? Math.round((occupied / totalCapacity) * 100)
            : 0,
        lifetimeRevenue: allPaid._sum.priceAgorot ?? 0,
        lifetimeOrders: allPaid._count._all,
      },
      overTime,
      byCity,
      topSlots,
    });
  });
}

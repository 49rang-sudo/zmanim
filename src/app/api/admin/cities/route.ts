import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCityAvailability } from "@/lib/availability";
import { slugify } from "@/lib/utils";
import { fail, handle, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createCitySchema = z.object({
  name: z.string().trim().min(2, "שם עיר קצר מדי").max(80),
  region: z.string().trim().max(80).optional().nullable(),
  capacity: z.coerce.number().int().min(1).max(200),
  distribution: z.coerce.number().int().min(0).max(10_000_000).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
  visible: z.boolean().default(true),
  autoHideWhenFull: z.boolean().default(false),
});

/** GET /api/admin/cities — כולל ערים מוסתרות ונתוני תפוסה */
export async function GET() {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const [availability, cities] = await Promise.all([
      getCityAvailability(true),
      prisma.city.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
    ]);

    const byId = new Map(availability.map((a) => [a.id, a]));

    return ok({
      cities: cities.map((city) => ({
        ...city,
        taken: byId.get(city.id)?.taken ?? 0,
        remaining: byId.get(city.id)?.remaining ?? city.capacity,
        isFull: byId.get(city.id)?.isFull ?? false,
      })),
    });
  });
}

/** POST /api/admin/cities — הוספת עיר */
export async function POST(request: Request) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const body = await parseBody(request, createCitySchema);
    if (!body.ok) return body.response;

    const data = body.data;

    const exists = await prisma.city.findUnique({ where: { name: data.name } });
    if (exists) {
      return fail(409, "CITY_EXISTS", "כבר קיימת עיר בשם הזה");
    }

    const last = await prisma.city.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const city = await prisma.city.create({
      data: {
        name: data.name,
        slug: slugify(data.name),
        region: data.region ?? null,
        capacity: data.capacity,
        distribution: data.distribution ?? null,
        note: data.note ?? null,
        visible: data.visible,
        autoHideWhenFull: data.autoHideWhenFull,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });

    return ok({ city }, 201);
  });
}

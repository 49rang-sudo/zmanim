import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, notFound, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createEditionSchema = z.object({
  cityId: z.string().min(1),
  hebrewLabel: z.string().trim().min(1, "יש להזין תווית").max(60),
  gregorianMonth: z.coerce.number().int().min(1).max(12),
  gregorianYear: z.coerce.number().int().min(2020).max(2100),
  capacity: z.coerce.number().int().min(1).max(200),
  closesAt: z.coerce.date(),
  status: z.enum(["OPEN", "CLOSED"]).default("OPEN"),
  marketingNote: z.string().trim().max(400).optional().nullable(),
});

/** GET /api/admin/editions?cityId=<id> — ברירת מחדל: כל הערים */
export async function GET(request: Request) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const url = new URL(request.url);
    const cityId = url.searchParams.get("cityId");

    const editions = await prisma.edition.findMany({
      where: cityId && cityId !== "ALL" ? { cityId } : {},
      orderBy: [
        { city: { sortOrder: "asc" } },
        { gregorianYear: "asc" },
        { gregorianMonth: "asc" },
      ],
      include: {
        city: { select: { name: true } },
        _count: { select: { reservations: true } },
      },
    });

    return ok({
      editions: editions.map((e) => ({
        id: e.id,
        cityId: e.cityId,
        cityName: e.city.name,
        hebrewLabel: e.hebrewLabel,
        gregorianMonth: e.gregorianMonth,
        gregorianYear: e.gregorianYear,
        capacity: e.capacity,
        taken: e._count.reservations,
        remaining: Math.max(0, e.capacity - e._count.reservations),
        isFull: e._count.reservations >= e.capacity,
        closesAt: e.closesAt,
        status: e.status,
        marketingNote: e.marketingNote,
      })),
    });
  });
}

/** POST /api/admin/editions — יצירת מהדורה חדשה (חודש) לעיר */
export async function POST(request: Request) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const body = await parseBody(request, createEditionSchema);
    if (!body.ok) return body.response;
    const data = body.data;

    const city = await prisma.city.findUnique({ where: { id: data.cityId } });
    if (!city) return notFound("העיר");

    const exists = await prisma.edition.findUnique({
      where: {
        cityId_gregorianYear_gregorianMonth: {
          cityId: data.cityId,
          gregorianYear: data.gregorianYear,
          gregorianMonth: data.gregorianMonth,
        },
      },
    });
    if (exists) {
      return fail(
        409,
        "EDITION_EXISTS",
        "כבר קיימת מהדורה לחודש הזה בעיר הזו",
      );
    }

    const edition = await prisma.edition.create({
      data: {
        cityId: data.cityId,
        hebrewLabel: data.hebrewLabel,
        gregorianMonth: data.gregorianMonth,
        gregorianYear: data.gregorianYear,
        capacity: data.capacity,
        closesAt: data.closesAt,
        status: data.status,
        marketingNote: data.marketingNote ?? null,
      },
    });

    return ok({ edition }, 201);
  });
}

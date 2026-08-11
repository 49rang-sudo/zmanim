import { prisma } from "@/lib/prisma";
import { getOpenEditionsForCity } from "@/lib/availability";
import { handle, notFound, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cities/:id/editions
 * מהדורות פתוחות של עיר, כולל אילו משבצות תפוסות בכל אחת —
 * זה מה שמניע את דפדוף החודשים ואת צביעת המוקאפ באשף ההזמנה.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;

    const city = await prisma.city.findUnique({ where: { id } });
    if (!city || !city.visible) return notFound("העיר");

    const editions = await getOpenEditionsForCity(id);
    return ok({ editions });
  });
}

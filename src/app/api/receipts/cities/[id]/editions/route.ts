import { prisma } from "@/lib/prisma";
import { getReceiptEditionsForCity } from "@/lib/receipts";
import { handle, notFound, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/receipts/cities/:id/editions
 *
 * החודשים של העיר שעדיין מקבלים קבלות, וכל עסק שמפרסם בהם —
 * זה מה שמניע את שני הבוררים בטופס הקבלות.
 *
 * מקביל ל-/api/cities/:id/editions של אשף ההזמנה, אבל עם הגדרת
 * "פתוח" הפוכה: שם זה "עדיין אפשר לקנות מקום", כאן זה "הלוח כבר
 * תלוי על הקיר". ראו את ההסבר בראש src/lib/receipts.ts.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;

    const city = await prisma.city.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!city) return notFound("העיר");

    const editions = await getReceiptEditionsForCity(id);
    return ok({ city, editions });
  });
}

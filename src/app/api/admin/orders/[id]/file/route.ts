import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createDownloadUrl } from "@/lib/s3";
import { fail, handle, notFound, unauthorized } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders/:id/file
 *
 * מייצר קישור הורדה חתום קצר-מועד ומפנה אליו.
 * הדלי עצמו פרטי — אין דרך להגיע לקובץ בלי לעבור כאן,
 * וזה אומר: בלי סשן מנהל תקף.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        fileKey: true,
        fileName: true,
        reference: true,
        city: { select: { name: true } },
        sku: true,
        artworkDownloadedAt: true,
        artworkDownloadedBy: true,
      },
    });

    if (!order) return notFound("ההזמנה");

    if (!order.fileKey) {
      return fail(404, "NO_FILE", "לא הועלה קובץ להזמנה זו");
    }

    // שם ידידותי לבית הדפוס: עיר · SKU · מספר הזמנה
    const extension = order.fileName?.slice(
      order.fileName.lastIndexOf("."),
    ) ?? "";
    const downloadName = `${order.city.name}-${order.sku}-${order.reference}${extension}`;

    const url = await createDownloadUrl(order.fileKey, downloadName, 300);

    // הורדה = הקובץ נמצא אצל הגרפיקאית, ולכן ההזמנה עוברת
    // אוטומטית לטבלת "טופל". רק ההורדה הראשונה קובעת את
    // חותמת הזמן; הורדה חוזרת לא משנה מי טיפל ומתי.
    await prisma.order.update({
      where: { id },
      data: {
        productionStatus: "HANDLED",
        artworkDownloadedAt: order.artworkDownloadedAt ?? new Date(),
        artworkDownloadedBy:
          order.artworkDownloadedBy ?? admin.email ?? admin.id,
      },
    });

    return NextResponse.redirect(url, {
      status: 302,
      headers: { "Cache-Control": "no-store" },
    });
  });
}

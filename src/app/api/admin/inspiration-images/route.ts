import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/inspiration-images — כל ספריית התמונות הקבועה,
 * כולל לא-פעילות, עם כל ה-Hotspot-ים שלהן וה-AdSlot המקושר לכל אחד
 * (כדי שהעורך הוויזואלי (InspirationImagesTab.tsx) יוכל להציג מחיר/
 * מכירות ולדעת אילו חלונות נעולים — יש להם SlotReservation).
 *
 * זו ספרייה *קבועה* (12–13 תמונות לפי חודש עברי, ראו ההערה בסכמה
 * ב-InspirationImage.gregorianMonth) — לא מסך "יצירת עוד תמונות".
 * ראו POST למטה להבהרה למה הוא לא אמור לשמש כפיצ'ור יומיומי.
 */
export async function GET() {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const images = await prisma.inspirationImage.findMany({
      orderBy: [{ gregorianMonth: "asc" }, { sortOrder: "asc" }],
      include: {
        hotspots: {
          orderBy: { sortOrder: "asc" },
          include: {
            slot: {
              include: { _count: { select: { reservations: true } } },
            },
          },
        },
      },
    });

    return ok({
      images: images.map((image) => ({
        ...image,
        hotspots: image.hotspots.map((h) => {
          const { slot, ...hotspot } = h;
          return {
            ...hotspot,
            slot: slot
              ? {
                  id: slot.id,
                  sku: slot.sku,
                  name: slot.name,
                  priceAgorot: slot.priceAgorot,
                  active: slot.active,
                  // חלון "נעול" (לא ניתן לעריכה) אם למשבצת המקושרת יש
                  // ולו שריון/מכירה אחת — נבדק גם כאן לתצוגה וגם, וזה
                  // הקריטי, שוב בשרת בזמן PATCH (ראו hotspots/[id]/route.ts).
                  locked: slot._count.reservations > 0,
                }
              : null,
          };
        }),
      })),
    });
  });
}

const createImageSchema = z.object({
  label: z.string().trim().min(1, "יש להזין שם פנימי לתמונה").max(80),
  /** null = סצנה כללית (גיבוי לחודש בלי אמנות ייעודית) */
  gregorianMonth: z.coerce.number().int().min(1).max(12).nullable().optional(),
  /** מגיע כבר מ-/api/admin/media, לא מועלה כאן */
  imageUrl: z.string().trim().min(1, "חסרה כתובת תמונה"),
  aspectRatio: z.coerce.number().positive().max(10).optional(),
});

/**
 * POST /api/admin/inspiration-images — איתחול חד-פעמי של שורה
 * לחודש שעדיין ממש חסר לו תמונה בספרייה הקבועה. **לא** פיצ'ור
 * יומיומי: הספרייה קבועה ב-12–13 שורות (חודש עברי), ואם יש כבר
 * שורה פעילה לאותו חודש — מחליפים את התמונה שלה דרך PATCH
 * ב-inspiration-images/[id], לא יוצרים עוד שורה.
 */
export async function POST(request: Request) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const body = await parseBody(request, createImageSchema);
    if (!body.ok) return body.response;
    const data = body.data;

    if (data.gregorianMonth != null) {
      const existing = await prisma.inspirationImage.findFirst({
        where: { gregorianMonth: data.gregorianMonth, active: true },
      });
      if (existing) {
        return fail(
          409,
          "MONTH_ALREADY_HAS_IMAGE",
          "לחודש הזה כבר יש תמונת השראה פעילה — להחליף את התמונה שלה דרך עריכת השורה הקיימת, לא ליצור שורה נוספת",
        );
      }
    }

    const image = await prisma.inspirationImage.create({
      data: {
        label: data.label,
        gregorianMonth: data.gregorianMonth ?? null,
        imageUrl: data.imageUrl,
        aspectRatio: data.aspectRatio ?? 1.5,
      },
    });

    return ok({ image }, 201);
  });
}

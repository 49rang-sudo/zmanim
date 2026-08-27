import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, notFound, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

/**
 * PATCH /api/admin/inspiration-images/[id] — עריכת שורה קיימת
 * בספרייה הקבועה: החלפת קובץ התמונה (הכתובת מגיעה מ-/api/admin/media,
 * לא מועלית כאן), עדכון label/aspectRatio, או הפעלה/השבתה. **אין**
 * DELETE במסלול הזה בכוונה — מחיקת InspirationImage הייתה מפילה
 * (Cascade) את כל ה-Hotspot-ים שלה, ודרכם עלולה לפגוע ב-AdSlot
 * שהזמנות אמיתיות מצביעות עליו. אם צריך "להעלים" תמונה — active:false.
 */
const patchImageSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  imageUrl: z.string().trim().min(1).optional(),
  aspectRatio: z.coerce.number().positive().max(10).optional(),
  active: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const { id } = await params;
    const body = await parseBody(request, patchImageSchema);
    if (!body.ok) return body.response;

    const exists = await prisma.inspirationImage.findUnique({ where: { id } });
    if (!exists) return notFound("תמונת ההשראה");

    const image = await prisma.inspirationImage.update({
      where: { id },
      data: body.data,
    });

    return ok({ image });
  });
}

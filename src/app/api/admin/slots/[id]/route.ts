import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, notFound, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

const patchSlotSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(600).optional().nullable(),
  /** מחיר מתקבל בשקלים מהטופס ונשמר באגורות */
  priceShekels: z.coerce.number().min(0).max(1_000_000).optional(),
  badge: z.string().trim().max(30).optional().nullable(),
  checkoutUrl: z
    .union([z.string().trim().url("כתובת הסליקה אינה תקינה"), z.literal("")])
    .optional()
    .nullable(),
  active: z.boolean().optional(),
  widthCm: z.coerce.number().positive().max(500).optional(),
  heightCm: z.coerce.number().positive().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const { id } = await params;
    const body = await parseBody(request, patchSlotSchema);
    if (!body.ok) return body.response;

    const exists = await prisma.adSlot.findUnique({ where: { id } });
    if (!exists) return notFound("המשבצת");

    const { priceShekels, checkoutUrl, ...rest } = body.data;

    const slot = await prisma.adSlot.update({
      where: { id },
      data: {
        ...rest,
        // עיגול לאגורה שלמה — כסף לא נשמר כ-Float
        ...(priceShekels !== undefined
          ? { priceAgorot: Math.round(priceShekels * 100) }
          : {}),
        ...(checkoutUrl !== undefined
          ? { checkoutUrl: checkoutUrl === "" ? null : checkoutUrl }
          : {}),
      },
    });

    return ok({ slot });
  });
}

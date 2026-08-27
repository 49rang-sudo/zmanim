import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, notFound, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

/**
 * PATCH /api/admin/hotspots/[id] — הפעולה היומיומית העיקרית: הזזת
 * ריבוע (x/y/width/height) ועריכת הטקסט שבתוכו (category/tier/active).
 *
 * שדות של AdSlot עצמו (name/price/badge) **לא** נערכים כאן במכוון —
 * נשארים ב-/api/admin/slots/[id] הקיים, כדי לא לשכפל את הלוגיקה הזו
 * (ראו התוכנית, שלב 5א). כאן רק שדות שייכים ל-Hotspot עצמו.
 *
 * בדיקת בטיחות קריטית (לא לדלג!): אם ל-AdSlot המקושר יש ולו
 * SlotReservation אחד — נחסם כאן, בשרת, לפני העדכון. זו בדיוק הפרצה
 * שבייס44 השאיר (AdPositionsVisualEditor.jsx חוסם רק קליק בצד לקוח,
 * לא ב-API) — הפורט הזה חייב שלא לחזור עליה.
 */
const patchHotspotSchema = z.object({
  category: z.string().trim().min(1).max(80).optional(),
  tier: z.enum(["ANCHOR", "COMPLEMENTARY"]).optional(),
  x: z.coerce.number().min(0).max(100).optional(),
  y: z.coerce.number().min(0).max(100).optional(),
  width: z.coerce.number().positive().max(100).optional(),
  height: z.coerce.number().positive().max(100).optional(),
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
    const body = await parseBody(request, patchHotspotSchema);
    if (!body.ok) return body.response;
    const data = body.data;

    // --- שלב 1: טעינת החלון + המשבצת המקושרת + ספירת שריונים ---
    // חייב לקרות *לפני* כל update, ולא רק בצד ה-UI.
    const hotspot = await prisma.hotspot.findUnique({
      where: { id },
      include: {
        slot: { include: { _count: { select: { reservations: true } } } },
      },
    });
    if (!hotspot) return notFound("החלון");

    // --- שלב 2: החסימה עצמה — עוצרת כאן, לפני כל קריאת update ---
    if (hotspot.slot && hotspot.slot._count.reservations > 0) {
      return fail(
        409,
        "HOTSPOT_LOCKED",
        "לא ניתן לערוך חלון עם משבצת ששוריינה או נמכרה. אפשר לערוך רק חלונות פנויים.",
      );
    }

    // --- שלב 3: בדיקת גבולות אם עודכנה גיאומטריה ---
    const nextX = data.x ?? hotspot.x;
    const nextY = data.y ?? hotspot.y;
    const nextWidth = data.width ?? hotspot.width;
    const nextHeight = data.height ?? hotspot.height;
    if (nextX + nextWidth > 100.001 || nextY + nextHeight > 100.001) {
      return fail(
        422,
        "OUT_OF_BOUNDS",
        "מיקום/גודל החלון חורג מגבולות התמונה (x+width וגם y+height חייבים להישאר עד 100%)",
      );
    }

    // --- שלב 4: העדכון עצמו — רק עכשיו, אחרי שהחסימה עברה ---
    const updated = await prisma.hotspot.update({
      where: { id },
      data,
    });

    return ok({ hotspot: updated });
  });
}

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, notFound, ok, parseBody, unauthorized } from "@/lib/api";
import { DEFAULT_TIER_BASE_PRICE_AGOROT, TIER_PRINT_SIZE_CM } from "@/lib/packages";

export const runtime = "nodejs";

const createHotspotSchema = z.object({
  inspirationImageId: z.string().min(1),
  /** קטגוריית העסק — זה גם מה שמוצג ללקוחות ("מקום זה שמור ל...") */
  category: z.string().trim().min(1, "יש להזין קטגוריית עסק").max(80),
  tier: z.enum(["ANCHOR", "COMPLEMENTARY"]).default("COMPLEMENTARY"),
  x: z.coerce.number().min(0).max(100),
  y: z.coerce.number().min(0).max(100),
  width: z.coerce.number().positive().max(100),
  height: z.coerce.number().positive().max(100),
  /** ברירת מחדל אם לא סופק: DEFAULT_TIER_BASE_PRICE_AGOROT לפי הדרגה */
  priceAgorot: z.coerce.number().int().min(0).max(100_000_000).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

/**
 * POST /api/admin/hotspots — יוצר Hotspot **ויוצר אוטומטית AdSlot
 * מקושר** באותה פעולה (שם/מחיר ברירת מחדל, שניהם ניתנים לעריכה
 * אחר כך) — הוחלט במפורש בתוכנית המיגרציה: לא שני שלבים נפרדים,
 * כדי שריבוע חדש יהיה מיד בר-מכירה.
 *
 * נקרא בעיקר בזמן הכנת התבנית הקבועה (12–13 חלונות ברירת מחדל
 * לכל תמונת-חודש), לא בכל יצירת מהדורה — יצירת מהדורה (עיר + מספר
 * חודשים) לא נוגעת ב-InspirationImage/Hotspot בכלל, ראו
 * src/app/api/admin/editions/route.ts.
 */
export async function POST(request: Request) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const body = await parseBody(request, createHotspotSchema);
    if (!body.ok) return body.response;
    const data = body.data;

    const image = await prisma.inspirationImage.findUnique({
      where: { id: data.inspirationImageId },
    });
    if (!image) return notFound("תמונת ההשראה");

    if (data.x + data.width > 100.001 || data.y + data.height > 100.001) {
      return fail(
        422,
        "OUT_OF_BOUNDS",
        "מיקום/גודל החלון חורג מגבולות התמונה (x+width וגם y+height חייבים להישאר עד 100%)",
      );
    }

    const priceAgorot = data.priceAgorot ?? DEFAULT_TIER_BASE_PRICE_AGOROT[data.tier];
    const { widthCm, heightCm } = TIER_PRINT_SIZE_CM[data.tier];

    const existingCount = await prisma.hotspot.count({
      where: { inspirationImageId: data.inspirationImageId },
    });

    const { hotspot, slot } = await prisma.$transaction(async (tx) => {
      const hotspot = await tx.hotspot.create({
        data: {
          inspirationImageId: data.inspirationImageId,
          category: data.category,
          tier: data.tier,
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
          priceAgorot,
          sortOrder: data.sortOrder ?? existingCount,
        },
      });

      // sku נגזר מ-id ה-Hotspot עצמו — ייחודי מובנה, בלי מונה/מקביליות
      const slot = await tx.adSlot.create({
        data: {
          sku: `HS-${hotspot.id}`,
          name: data.category,
          hotspotId: hotspot.id,
          // הרשת הישנה לא רלוונטית לחלון על תמונת השראה — ערכים
          // ניטרליים, כמו שכבר נעשה ב-prisma/seed.ts לחלונות אלה.
          col: 1,
          row: 1,
          colSpan: 1,
          rowSpan: 1,
          widthCm,
          heightCm,
          priceAgorot,
          active: true,
          sortOrder: data.sortOrder ?? existingCount,
        },
      });

      return { hotspot, slot };
    });

    return ok({ hotspot: { ...hotspot, slot } }, 201);
  });
}

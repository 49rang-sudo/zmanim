import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { reserveSlot, SlotUnavailableError } from "@/lib/availability";
import { generateAccessToken, generateReference } from "@/lib/ids";
import { getSiteSettings } from "@/lib/site";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { AD_PACKAGES, sumWithPackageDiscount } from "@/lib/packages";
import { fail, handle, ok, parseBody } from "@/lib/api";

export const runtime = "nodejs";

const createOrderSchema = z.object({
  cityId: z.string().min(1),
  selections: z
    .array(
      z.object({
        editionId: z.string().min(1),
        slotId: z.string().min(1),
      }),
    )
    .min(1, "יש לבחור לפחות מהדורה אחת")
    .max(24)
    .refine(
      (sels) =>
        new Set(sels.map((s) => s.editionId)).size === sels.length,
      { message: "מהדורות כפולות" },
    ),
  // האישור מגיע מהלקוח, אבל חותמת הזמן נקבעת בשרת בלבד
  tosAccepted: z.literal(true, {
    message: "יש לאשר את תנאי ההתקשרות",
  }),
  contactName: z.string().trim().min(2, "שם איש קשר קצר מדי").max(120),
  businessName: z.string().trim().max(160).optional().nullable(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{9,20}$/, "מספר טלפון לא תקין"),
  email: z.string().trim().toLowerCase().email("כתובת אימייל לא תקינה"),
  notes: z.string().trim().max(2000).optional().nullable(),
});

/**
 * POST /api/orders
 * יוצר הזמנה ותופס את המשבצת להחזקה זמנית.
 * מחזיר accessToken — טוקן היכולת שאיתו הלקוח ממשיך את התהליך.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(
      `create-order:${clientIp(request.headers)}`,
      10,
      10 * 60 * 1000,
    );
    if (!limit.ok) {
      return fail(429, "RATE_LIMITED", "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.");
    }

    const body = await parseBody(request, createOrderSchema);
    if (!body.ok) return body.response;
    const input = body.data;

    const slotIds = [...new Set(input.selections.map((s) => s.slotId))];
    const [slots, city, settings] = await Promise.all([
      prisma.adSlot.findMany({ where: { id: { in: slotIds } } }),
      prisma.city.findUnique({ where: { id: input.cityId } }),
      getSiteSettings(),
    ]);

    const slotsById = new Map(slots.map((s) => [s.id, s]));
    if (slotIds.some((id) => !slotsById.get(id)?.active)) {
      return fail(404, "SLOT_NOT_FOUND", "אחת המשבצות המבוקשות אינה זמינה");
    }
    if (!city || !city.visible) {
      return fail(404, "CITY_NOT_FOUND", "העיר המבוקשת אינה זמינה");
    }

    // המשבצת הראשונה קובעת את "הסוג" (גודל) של כל ההזמנה — כל
    // הבחירות האחרות חייבות להתאים לה במידות, גם אם המיקום/המק"ט
    // שונה בכל חודש. לא סומכים על הלקוח — נבדק גם כאן בשרת.
    const anchorSlot = slotsById.get(input.selections[0].slotId)!;
    const sameType = slots.every(
      (s) =>
        s.colSpan === anchorSlot.colSpan &&
        s.rowSpan === anchorSlot.rowSpan &&
        s.widthCm === anchorSlot.widthCm &&
        s.heightCm === anchorSlot.heightCm,
    );
    if (!sameType) {
      return fail(
        422,
        "TYPE_MISMATCH",
        "כל המשבצות בהזמנה חייבות להיות מאותו גודל",
      );
    }

    const reference = generateReference();
    const accessToken = generateAccessToken();
    const editionsCount = input.selections.length;
    // תווית פריסט קוסמטית בלבד לתצוגה — אם הכמות תואמת דרגה מוכרת
    const cosmeticTier =
      AD_PACKAGES.find(
        (p) => p.editions === editionsCount && p.id !== "SINGLE",
      )?.id ?? null;
    const totalPriceAgorot = sumWithPackageDiscount(
      input.selections.map((s) => slotsById.get(s.slotId)!.priceAgorot),
    );

    // ההזמנה נוצרת קודם, ורק אז נתפסות המשבצות — כך שאם התפיסה
    // נכשלת בגלל מרוץ, אנחנו מוחקים הזמנה ולא משאירים תפיסה יתומה.
    const order = await prisma.order.create({
      data: {
        reference,
        accessToken,
        status: "PENDING",
        slotId: anchorSlot.id,
        cityId: city.id,
        sku: anchorSlot.sku,
        // המחיר מוקפא ברגע ההזמנה — שינוי מחירון לא ישפיע עליה.
        priceAgorot: totalPriceAgorot,
        packageTier: cosmeticTier,
        packageEditions: editionsCount,
        selections: input.selections,
        contactName: input.contactName,
        businessName: input.businessName ?? null,
        phone: input.phone,
        email: input.email,
        notes: input.notes ?? null,
        tosAcceptedAt: new Date(),
        tosVersion: settings.tosVersion,
      },
    });

    try {
      const holdExpiresAt = await reserveSlot(
        city.id,
        input.selections,
        order.id,
      );

      return ok(
        {
          id: order.id,
          reference: order.reference,
          accessToken: order.accessToken,
          priceAgorot: order.priceAgorot,
          packageTier: order.packageTier,
          packageEditions: order.packageEditions,
          selections: input.selections,
          holdExpiresAt: holdExpiresAt.toISOString(),
          slot: { id: anchorSlot.id, name: anchorSlot.name, sku: anchorSlot.sku },
          city: { id: city.id, name: city.name },
        },
        201,
      );
    } catch (error) {
      await prisma.order.delete({ where: { id: order.id } });

      if (error instanceof SlotUnavailableError) {
        if (error.reason === "SLOT_TAKEN") {
          return fail(
            409,
            "SLOT_TAKEN",
            "המשבצת הזו כבר נתפסה באחת המהדורות שבחרתם",
          );
        }
        return fail(
          409,
          "EDITION_FULL",
          "העיר הזו מלאה לאחת המהדורות שבחרתם",
        );
      }
      throw error;
    }
  });
}

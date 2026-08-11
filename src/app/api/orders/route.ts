import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { reserveSlot, SlotUnavailableError } from "@/lib/availability";
import { generateAccessToken, generateReference } from "@/lib/ids";
import { getSiteSettings } from "@/lib/site";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { AD_PACKAGES, packageTotalAgorotForEditions } from "@/lib/packages";
import { fail, handle, ok, parseBody } from "@/lib/api";

export const runtime = "nodejs";

const createOrderSchema = z.object({
  slotId: z.string().min(1),
  cityId: z.string().min(1),
  editionIds: z
    .array(z.string().min(1))
    .min(1, "יש לבחור לפחות מהדורה אחת")
    .max(24)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "מהדורות כפולות",
    }),
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

    const [slot, city, settings] = await Promise.all([
      prisma.adSlot.findUnique({ where: { id: input.slotId } }),
      prisma.city.findUnique({ where: { id: input.cityId } }),
      getSiteSettings(),
    ]);

    if (!slot || !slot.active) {
      return fail(404, "SLOT_NOT_FOUND", "המשבצת המבוקשת אינה זמינה");
    }
    if (!city || !city.visible) {
      return fail(404, "CITY_NOT_FOUND", "העיר המבוקשת אינה זמינה");
    }

    const reference = generateReference();
    const accessToken = generateAccessToken();
    const editionsCount = input.editionIds.length;
    // תווית פריסט קוסמטית בלבד לתצוגה — אם הכמות תואמת דרגה מוכרת
    const cosmeticTier =
      AD_PACKAGES.find(
        (p) => p.editions === editionsCount && p.id !== "SINGLE",
      )?.id ?? null;

    // ההזמנה נוצרת קודם, ורק אז נתפסת המשבצת — כך שאם התפיסה
    // נכשלת בגלל מרוץ, אנחנו מוחקים הזמנה ולא משאירים תפיסה יתומה.
    const order = await prisma.order.create({
      data: {
        reference,
        accessToken,
        status: "PENDING",
        slotId: slot.id,
        cityId: city.id,
        sku: slot.sku,
        // המחיר מוקפא ברגע ההזמנה — שינוי מחירון לא ישפיע עליה.
        // בחבילה זה כבר הסכום הכולל אחרי הנחה, לא מחיר ליחידה.
        priceAgorot: packageTotalAgorotForEditions(
          slot.priceAgorot,
          editionsCount,
        ),
        packageTier: cosmeticTier,
        packageEditions: editionsCount,
        editionIds: input.editionIds,
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
        slot.id,
        input.editionIds,
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
          editionIds: order.editionIds,
          holdExpiresAt: holdExpiresAt.toISOString(),
          slot: { id: slot.id, name: slot.name, sku: slot.sku },
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

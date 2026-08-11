import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fail, handle, ok, parseBody } from "@/lib/api";

export const runtime = "nodejs";

const joinSchema = z.object({
  firstName: z.string().trim().min(1, "שם פרטי חסר").max(80),
  lastName: z.string().trim().min(1, "שם משפחה חסר").max(80),
  email: z.string().trim().toLowerCase().email("כתובת אימייל לא תקינה"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{9,20}$/, "מספר טלפון לא תקין")
    .optional()
    .or(z.literal("")),
});

/**
 * POST /api/mailing-list — הצטרפות עצמאית לרשימת התפוצה, לא תלויה
 * בהזמנה. זו החלונית הצפה בדף הבית (src/components/wizard/MailingListDialog.tsx).
 */
export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(
      `join-mailing-list:${clientIp(request.headers)}`,
      8,
      10 * 60 * 1000,
    );
    if (!limit.ok) {
      return fail(429, "RATE_LIMITED", "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.");
    }

    const body = await parseBody(request, joinSchema);
    if (!body.ok) return body.response;
    const input = body.data;

    await prisma.mailingListSubscriber.upsert({
      where: { email: input.email },
      create: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone || null,
      },
      update: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
      },
    });

    return ok({ joined: true }, 201);
  });
}

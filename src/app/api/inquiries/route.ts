import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fail, handle, ok, parseBody } from "@/lib/api";

export const runtime = "nodejs";

const phonePattern = /^[0-9+\-\s()]{9,20}$/;
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

/**
 * שני מקורות, אותה טבלה — אבל דרישות שדות שונות:
 *
 *  · FORM  — טופס הפנייה המלא (סעיף 15 בקופי). שם עסק, תחום,
 *            שם ליצירת קשר, טלפון ומייל הם חובה; מיקום, חודש
 *            משוער והערה אופציונליים.
 *  · POPUP — הפופאפ הקצר (סעיף 16). רק תחום העסק ודרך אחת לחזור
 *            אליו. הלקוחה ביקשה במפורש שתי שאלות בלבד; דרישת
 *            שדות נוספים כאן פשוט הייתה מבריחה את הליד.
 *
 * ההפרדה יושבת ב-API ולא בסכמת מסד הנתונים כי היא חוקיות של
 * *טופס*, לא של הנתון: פנייה מהפופאפ שהמנהלת השלימה ידנית
 * אינה פחות תקפה.
 */
const formSchema = z.object({
  source: z.literal("FORM"),
  businessName: z.string().trim().min(2, "שם העסק חסר").max(120),
  category: z.string().trim().min(2, "נא לפרט מה העסק עושה").max(160),
  location: optionalText(120),
  contactName: z.string().trim().min(2, "נא למלא שם ליצירת קשר").max(120),
  phone: z.string().trim().regex(phonePattern, "מספר טלפון לא תקין"),
  email: z.string().trim().toLowerCase().regex(emailPattern, "כתובת מייל לא תקינה").max(160),
  monthGuess: optionalText(200),
  note: optionalText(1000),
});

const popupSchema = z.object({
  source: z.literal("POPUP"),
  category: z.string().trim().min(2, "נא לפרט מה העסק עושה").max(160),
  /**
   * שדה אחד, "טלפון / מייל" — בדיוק כפי שהלקוחה ניסחה אותו. מה
   * שהוקלד מסווג כאן לפי @ ונשמר בעמודה הנכונה, כדי שהייצוא
   * והחזרה ללקוח יעבדו על אותם שדות כמו פניות מהטופס המלא.
   */
  contact: z
    .string()
    .trim()
    .min(5, "נא להשאיר טלפון או מייל")
    .max(160)
    .refine(
      (value) => emailPattern.test(value) || phonePattern.test(value),
      "נא להשאיר טלפון או כתובת מייל תקינים",
    ),
});

const inquirySchema = z.discriminatedUnion("source", [formSchema, popupSchema]);

/**
 * POST /api/inquiries — "בדקו לי התאמה".
 *
 * ליד ציבורי לגמרי: אין כאן התחברות, ולכן הגנת הקצב היא כל מה
 * שעומד בין הטופס לבין הצפה. חלון רחב יחסית (30 דקות) ומכסה
 * נמוכה — אדם אמיתי שולח פנייה אחת, אולי שתיים אם טעה בטלפון.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const limit = rateLimit(
      `business-inquiry:${clientIp(request.headers)}`,
      5,
      30 * 60 * 1000,
    );
    if (!limit.ok) {
      return fail(
        429,
        "RATE_LIMITED",
        "כבר קיבלנו כמה פניות מהמכשיר הזה. נסו שוב בעוד כמה דקות, או התקשרו אלינו.",
      );
    }

    const body = await parseBody(request, inquirySchema);
    if (!body.ok) return body.response;
    const input = body.data;

    if (input.source === "FORM") {
      await prisma.businessInquiry.create({
        data: {
          source: "FORM",
          businessName: input.businessName,
          category: input.category,
          location: input.location || null,
          contactName: input.contactName,
          phone: input.phone,
          email: input.email,
          monthGuess: input.monthGuess || null,
          note: input.note || null,
        },
      });
    } else {
      const isEmail = emailPattern.test(input.contact);
      await prisma.businessInquiry.create({
        data: {
          source: "POPUP",
          category: input.category,
          phone: isEmail ? null : input.contact,
          email: isEmail ? input.contact.toLowerCase() : null,
        },
      });
    }

    // מזהה הפנייה לא מוחזר בכוונה — אין לפונה מסך שבו הוא יכול
    // לצפות בה, ומזהה שדולף לדף ציבורי הוא רק משטח תקיפה.
    return ok({ received: true }, 201);
  });
}

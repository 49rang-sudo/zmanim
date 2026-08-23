import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { fail, handle, ok } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { checkReceiptFile, RECEIPT_MIME, sanitizeFilename } from "@/lib/file-check";
import { generateReceiptKey } from "@/lib/ids";
import { putArtwork } from "@/lib/s3";
import { RECEIPT_MAX_MB, resolveReceiptTarget } from "@/lib/receipts";

export const runtime = "nodejs";
// צילום קבלה מהטלפון, לרוב על סלולרי — מרשים לזה זמן
export const maxDuration = 120;

const fieldsSchema = z.object({
  orderId: z.string().trim().min(1, "לא נבחר עסק"),
  submitterName: z.string().trim().min(2, "השם קצר מדי").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{9,20}$/, "מספר טלפון לא תקין"),
  /** סכום הרכישה בשקלים — נשמר באגורות, כמו כל כסף במערכת */
  amountShekels: z.coerce
    .number()
    .positive("סכום הרכישה חייב להיות גדול מאפס")
    .max(100000, "סכום גבוה מדי — בדקו את הספרות"),
});

const TARGET_ERRORS = {
  NOT_FOUND: {
    status: 404,
    code: "BUSINESS_NOT_FOUND",
    message: "העסק שנבחר אינו קיים יותר. רעננו את הדף ונסו שוב.",
  },
  NOT_PAID: {
    status: 409,
    code: "BUSINESS_NOT_ACTIVE",
    message: "העסק שנבחר אינו מפרסם פעיל בלוח. רעננו את הדף ונסו שוב.",
  },
  MONTH_CLOSED: {
    status: 409,
    code: "MONTH_CLOSED",
    message: "החודש הזה נסגר לקבלת קבלות. אפשר להעלות רק לחודש הפתוח.",
  },
  RAFFLE_DONE: {
    status: 409,
    code: "RAFFLE_DONE",
    message: "ההגרלה של העסק הזה כבר התקיימה, ולכן אי אפשר להצטרף אליה.",
  },
} as const;

/**
 * POST /api/receipts
 * גוף: multipart/form-data — orderId, submitterName, phone,
 * amountShekels, file
 *
 * ציבורי לחלוטין: הקונה שמחזיק את הלוח המודפס לא מתחבר לשום דבר.
 * ההגנות הן הגבלת קצב לפי IP, אימות מלא בשרת של העסק שנבחר (לא
 * סומכים על ה-orderId שהדפדפן שלח), ובדיקת חתימת בתים לקובץ.
 *
 * ההגשה נשמרת כ-PENDING ותמיד ממתינה לאישור המנהלת — לכן טופס
 * ציבורי לא יכול "להכניס" קבלה להגרלה בעצמו.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const ip = clientIp(request.headers);

    const limit = rateLimit(`receipt:${ip}`, 6, 30 * 60 * 1000);
    if (!limit.ok) {
      return fail(
        429,
        "RATE_LIMITED",
        "יותר מדי העלאות מהחיבור הזה. נסו שוב בעוד כמה דקות.",
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return fail(400, "INVALID_FORM", "לא הצלחנו לקרוא את הטופס שנשלח");
    }

    const parsed = fieldsSchema.safeParse({
      orderId: form.get("orderId"),
      submitterName: form.get("submitterName"),
      phone: form.get("phone"),
      amountShekels: form.get("amountShekels"),
    });

    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_FAILED",
        parsed.error.issues.map((i) => i.message).join("; "),
      );
    }

    const input = parsed.data;

    // אימות סמכותי של היעד לפני שנוגעים בקובץ — אין טעם להעלות
    // לאחסון קבלה שממילא תיפסל.
    const target = await resolveReceiptTarget(input.orderId);
    if (!target.ok) {
      const e = TARGET_ERRORS[target.reason];
      return fail(e.status, e.code, e.message);
    }

    const file = form.get("file");

    if (!(file instanceof File)) return fail(400, "NO_FILE", "לא צורפה קבלה");
    if (file.size === 0) return fail(400, "EMPTY_FILE", "הקובץ ריק");

    // אותה נוסחה בדיוק שהעמוד מציג (src/app/receipts/page.tsx) —
    // המוקדם מבין תקרת השרת הכללית לתקרת הקבלות
    const maxMb = Math.min(env().MAX_UPLOAD_MB, RECEIPT_MAX_MB);
    if (file.size > maxMb * 1024 * 1024) {
      return fail(
        413,
        "FILE_TOO_LARGE",
        `הקובץ גדול מדי. המגבלה היא ${maxMb} מ״ב.`,
      );
    }

    const filename = sanitizeFilename(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    // סיומת ו-MIME מהדפדפן אינם ראיה — הקובץ נבדק לפי בתי החתימה
    const check = checkReceiptFile(filename, buffer);
    if (!check.ok) return fail(415, "UNSUPPORTED_FILE", check.message);

    const key = generateReceiptKey(target.reference, filename);

    await putArtwork(
      key,
      buffer,
      // ה-MIME נגזר מהסיומת שאומתה, לא מ-file.type שהלקוח שלח
      RECEIPT_MIME[check.extension] ?? "application/octet-stream",
      { "order-ref": target.reference, "kind": "receipt" },
    );

    const submission = await prisma.receiptSubmission.create({
      data: {
        orderId: target.orderId,
        submitterName: input.submitterName,
        phone: input.phone,
        amountAgorot: Math.round(input.amountShekels * 100),
        fileKey: key,
        status: "PENDING",
      },
      select: { id: true, submittedAt: true },
    });

    return ok(
      {
        submitted: true,
        id: submission.id,
        businessName: target.businessName,
        submittedAt: submission.submittedAt.toISOString(),
      },
      201,
    );
  });
}

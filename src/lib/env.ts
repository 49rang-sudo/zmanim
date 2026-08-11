import { z } from "zod";

/**
 * אימות משתני סביבה בטעינה. אם חסר משהו קריטי —
 * האפליקציה נופלת מיד עם הודעה ברורה, ולא בשקט בזמן ריצה.
 * לייבוא בקוד שרת בלבד.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL חסר"),

  AUTH_SECRET: z.string().min(16, "AUTH_SECRET חייב להיות לפחות 16 תווים"),

  // אופציונליים בכוונה: עד שיוגדרו ב-Google Cloud Console, כניסת
  // האדמין נכשלת בצורה נקייה (src/lib/auth.ts) — לא מפילה את כל האתר.
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

  S3_ENDPOINT: z.string().min(1),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: z
    .string()
    .default("true")
    .transform((v) => v === "true"),

  PAYMENT_WEBHOOK_SECRET: z.string().min(8),
  PAYMENT_PROVIDER: z.string().default("sumit"),

  // אופציונליים בכוונה: אין עדיין credentials אמיתיים מ-sumit, והאתר
  // חי בייצור — חוסר כאן לא יכול להפיל את כל האפליקציה בהפעלה.
  // chargeSumit() (src/lib/sumit.ts) בודק את הנוכחות שלהם בזמן ריצה
  // ומחזיר שגיאה נקייה למשתמש אם עוד לא הוגדרו.
  SUMIT_COMPANY_ID: z.coerce.number().int().positive().optional(),
  /** סוד שרת — Credentials.APIKey בקריאת החיוב */
  SUMIT_API_KEY: z.string().min(1).optional(),
  /** ציבורי בכוונה — נחשף לדפדפן דרך טופס האשראי המוטמע */
  SUMIT_API_PUBLIC_KEY: z.string().min(1).optional(),
  // TODO(sumit): לאמת מול לוח הבקרה של sumit שזו אכן כתובת הבסיס הנכונה ל-REST API
  SUMIT_API_BASE_URL: z.string().default("https://api.sumit.co.il"),

  NEXT_PUBLIC_BASE_URL: z.string().default("http://localhost:3000"),

  SLOT_HOLD_MINUTES: z.coerce.number().int().positive().default(45),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(60),
});

let cached: z.infer<typeof serverSchema> | null = null;

export function env() {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  · ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`משתני סביבה שגויים או חסרים:\n${issues}`);
  }

  cached = parsed.data;
  return cached;
}

/** סוגי קבצי אמנות שמותר להעלות לדפוס */
export const ALLOWED_UPLOAD_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/tiff": [".tif", ".tiff"],
  "application/postscript": [".eps", ".ai"],
  "image/vnd.adobe.photoshop": [".psd"],
  "application/zip": [".zip"],
};

export const ALLOWED_EXTENSIONS = Object.values(ALLOWED_UPLOAD_TYPES).flat();

import { z } from "zod";

/**
 * אימות משתני סביבה בטעינה. אם חסר משהו קריטי —
 * האפליקציה נופלת מיד עם הודעה ברורה, ולא בשקט בזמן ריצה.
 * לייבוא בקוד שרת בלבד.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL חסר"),

  AUTH_SECRET: z.string().min(16, "AUTH_SECRET חייב להיות לפחות 16 תווים"),

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

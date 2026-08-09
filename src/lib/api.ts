import { NextResponse } from "next/server";
import type { z } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function fail(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export const unauthorized = () =>
  fail(401, "UNAUTHORIZED", "נדרשת התחברות");

export const forbidden = () => fail(403, "FORBIDDEN", "אין הרשאה לפעולה זו");

export const notFound = (what = "המשאב") =>
  fail(404, "NOT_FOUND", `${what} לא נמצא`);

/**
 * קורא גוף JSON ומאמת אותו מול סכמת zod.
 * מחזיר או את הנתונים המאומתים או תשובת שגיאה מוכנה לשליחה.
 */
export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<
  { ok: true; data: z.infer<S> } | { ok: false; response: NextResponse }
> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: fail(400, "INVALID_JSON", "גוף הבקשה אינו JSON תקין"),
    };
  }

  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".") || "גוף הבקשה"}: ${i.message}`)
      .join("; ");
    return {
      ok: false,
      response: fail(422, "VALIDATION_FAILED", details),
    };
  }

  return { ok: true, data: parsed.data };
}

/**
 * עוטף מטפל מסלול: תופס חריגות לא צפויות, כותב אותן ללוג השרת
 * ומחזיר ללקוח הודעה כללית — בלי לדלוף פרטי מימוש.
 */
export async function handle(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    console.error("[api] שגיאה לא צפויה:", error);
    return fail(500, "INTERNAL_ERROR", "אירעה שגיאה. נסו שוב בעוד רגע.");
  }
}

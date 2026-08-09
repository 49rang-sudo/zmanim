import { NextResponse } from "next/server";
import { getArtworkStream } from "@/lib/s3";
import { extensionOf, IMAGE_MIME } from "@/lib/file-check";
import { handle, notFound } from "@/lib/api";

export const runtime = "nodejs";

/**
 * GET /api/media/<key>
 *
 * מגיש תמונות תוכן ציבוריות (לוגו) מתוך הדלי הפרטי, בלי לחשוף
 * את הדלי עצמו. רק תחת התחילית media/ — קבצי אמנות של לקוחות
 * לעולם לא נגישים מכאן.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  return handle(async () => {
    const { key } = await params;
    const joined = key.join("/");

    // חסימת מעבר תיקיות והצמדה לתחילית המותרת
    if (joined.includes("..") || joined.startsWith("/")) {
      return notFound("הקובץ");
    }

    const extension = extensionOf(joined);
    const contentType = IMAGE_MIME[extension];
    if (!contentType) return notFound("הקובץ");

    let body: Awaited<ReturnType<typeof getArtworkStream>>;
    try {
      body = await getArtworkStream(`media/${joined}`);
    } catch {
      return notFound("הקובץ");
    }

    if (!body) return notFound("הקובץ");

    const bytes = await body.transformToByteArray();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": contentType,
        // שם הקובץ מכיל בתים אקראיים, ולכן תוכן חדש = כתובת חדשה
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        // שכבת ההגנה השנייה מפני SVG עוין: גם אם משהו חמק
        // מהבדיקה בהעלאה, אין לו הרשאה להריץ או לטעון כלום.
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  });
}

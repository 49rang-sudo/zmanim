import { getReceiptCities } from "@/lib/receipts";
import { handle, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/receipts/cities
 *
 * הערים שיש בהן החודש למי להעלות קבלה. ציבורי בכוונה — הקונה
 * שמחזיק את הלוח המודפס לא מתחבר לשום דבר. מוחזרים רק שמות עסקים
 * ושמות ערים; שום פרט אישי של מפרסם (איש קשר, טלפון, אימייל) לא
 * עובר בנתיב הזה.
 */
export async function GET() {
  return handle(async () => {
    const cities = await getReceiptCities();
    return ok({ cities });
  });
}

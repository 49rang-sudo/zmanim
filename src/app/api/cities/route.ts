import { getCityAvailability } from "@/lib/availability";
import { handle, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cities
 * זמינות ערים. המלאי נספר ברמת העיר בלבד — גודל המודעה שנבחר
 * אינו משפיע על הזמינות.
 */
export async function GET() {
  return handle(async () => {
    const cities = await getCityAvailability();
    return ok({ cities });
  });
}

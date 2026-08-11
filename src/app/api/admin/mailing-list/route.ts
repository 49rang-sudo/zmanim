import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, ok, unauthorized } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/mailing-list — רשימת נרשמים לתפוצה, החדשים קודם. */
export async function GET() {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const subscribers = await prisma.mailingListSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    });

    return ok({ subscribers });
  });
}

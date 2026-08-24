import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, ok, unauthorized } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/inquiries — פניות עסקים, החדשות קודם. */
export async function GET() {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const inquiries = await prisma.businessInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return ok({ inquiries });
  });
}

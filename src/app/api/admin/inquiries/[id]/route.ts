import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, notFound, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "MATCHED", "CLOSED"]).optional(),
  adminNotes: z.string().max(4000).optional().nullable(),
});

/** PATCH /api/admin/inquiries/:id — מצב הטיפול בפנייה והערה פנימית */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const { id } = await params;
    const body = await parseBody(request, patchSchema);
    if (!body.ok) return body.response;

    const existing = await prisma.businessInquiry.findUnique({ where: { id } });
    if (!existing) return notFound("הפנייה");

    const inquiry = await prisma.businessInquiry.update({
      where: { id },
      data: {
        ...(body.data.status ? { status: body.data.status } : {}),
        ...(body.data.adminNotes !== undefined
          ? { adminNotes: body.data.adminNotes }
          : {}),
      },
    });

    return ok({ inquiry });
  });
}

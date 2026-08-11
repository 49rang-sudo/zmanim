import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { fail, handle, notFound, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

const setPasswordSchema = z.object({
  /// password: null/"" מסיר סיסמה קיימת וחוזר לכניסה עם Google בלבד
  password: z.string().trim().min(1).nullable(),
});

/**
 * PATCH /api/admin/users/:id — קביעה/איפוס/הסרה של סיסמת כניסה. OWNER
 * בלבד. מותר גם כלפי עצמך (בניגוד ל-DELETE) — ה-OWNER יכול/ה לקבוע
 * לעצמה סיסמה בלי לאבד את הגישה, בלי תלות בכניסת Google.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    if (!(await requireOwner())) return unauthorized();

    const { id } = await params;

    const target = await prisma.adminUser.findUnique({ where: { id } });
    if (!target) return notFound("המשתמש");

    const body = await parseBody(request, setPasswordSchema);
    if (!body.ok) return body.response;

    let passwordHash: string | null = null;
    if (body.data.password) {
      const issue = validatePasswordStrength(body.data.password);
      if (issue) return fail(422, "WEAK_PASSWORD", issue);
      passwordHash = await hashPassword(body.data.password);
    }

    await prisma.adminUser.update({ where: { id }, data: { passwordHash } });

    return ok({ hasPassword: passwordHash !== null });
  });
}

/**
 * DELETE /api/admin/users/:id — הסרת מייל מורשה. OWNER בלבד.
 * חסום למחיקת OWNER (אין דרך לאבד גישה למערכת) ולמחיקה עצמית.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const me = await requireOwner();
    if (!me) return unauthorized();

    const { id } = await params;

    if (id === me.id) {
      return fail(400, "CANNOT_DELETE_SELF", "אי אפשר להסיר את המשתמש שלך");
    }

    const target = await prisma.adminUser.findUnique({ where: { id } });
    if (!target) return notFound("המשתמש");

    if (target.role === "OWNER") {
      return fail(400, "CANNOT_DELETE_OWNER", "אי אפשר להסיר בעל/ת חשבון");
    }

    await prisma.adminUser.delete({ where: { id } });

    return ok({ deleted: true });
  });
}

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { fail, handle, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const addUserSchema = z.object({
  email: z.string().trim().email("כתובת אימייל לא תקינה"),
  name: z.string().trim().max(120).optional().nullable(),
  /// אופציונלי — בלי סיסמה, המנהל/ת יכולים להתחבר רק דרך Google
  password: z.string().trim().optional().nullable(),
});

/** GET /api/admin/users — רשימת מיילים מורשים. OWNER בלבד. */
export async function GET() {
  return handle(async () => {
    if (!(await requireOwner())) return unauthorized();

    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        passwordHash: true,
      },
    });

    return ok({
      users: users.map(({ passwordHash, ...u }) => ({
        ...u,
        hasPassword: passwordHash !== null,
      })),
    });
  });
}

/**
 * POST /api/admin/users — הוספת מייל מורשה חדש. OWNER בלבד.
 * נוצר תמיד כ-ADMIN — לעולם לא OWNER, כדי שמייל שנוסף לא יוכל
 * להוסיף עוד מיילים בעצמו.
 */
export async function POST(request: Request) {
  return handle(async () => {
    if (!(await requireOwner())) return unauthorized();

    const body = await parseBody(request, addUserSchema);
    if (!body.ok) return body.response;

    const email = body.data.email.toLowerCase().trim();

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return fail(409, "EMAIL_EXISTS", "המייל הזה כבר מורשה");
    }

    let passwordHash: string | null = null;
    if (body.data.password) {
      const issue = validatePasswordStrength(body.data.password);
      if (issue) return fail(422, "WEAK_PASSWORD", issue);
      passwordHash = await hashPassword(body.data.password);
    }

    const user = await prisma.adminUser.create({
      data: {
        email,
        name: body.data.name || null,
        role: "ADMIN",
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return ok({ user: { ...user, hasPassword: passwordHash !== null } }, 201);
  });
}

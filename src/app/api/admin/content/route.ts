import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { contentSchema, defaultContent } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import { handle, ok, parseBody, unauthorized } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const settings = await getSiteSettings();
    return ok(settings);
  });
}

const putSchema = z.object({
  content: contentSchema,
  landingEnabled: z.boolean(),
  /** העלאת גרסת התנאים מחייבת אישור מחדש בהזמנות חדשות */
  tosVersion: z.string().trim().min(1).max(20),
});

export async function PUT(request: Request) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    const body = await parseBody(request, putSchema);
    if (!body.ok) return body.response;

    const row = await prisma.siteContent.upsert({
      where: { id: "singleton" },
      update: {
        data: body.data.content,
        landingEnabled: body.data.landingEnabled,
        tosVersion: body.data.tosVersion,
      },
      create: {
        id: "singleton",
        data: body.data.content,
        landingEnabled: body.data.landingEnabled,
        tosVersion: body.data.tosVersion,
      },
    });

    return ok({ saved: true, updatedAt: row.updatedAt });
  });
}

/** POST — שחזור תוכן ברירת המחדל */
export async function POST() {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    await prisma.siteContent.upsert({
      where: { id: "singleton" },
      update: { data: defaultContent },
      create: { id: "singleton", data: defaultContent },
    });

    return ok({ restored: true, content: defaultContent });
  });
}

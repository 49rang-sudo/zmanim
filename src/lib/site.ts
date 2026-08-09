import { prisma } from "./prisma";
import { contentSchema, defaultContent, type SiteContentData } from "./content";

export type SiteSettings = {
  content: SiteContentData;
  landingEnabled: boolean;
  tosVersion: string;
};

/**
 * טוען את תוכן האתר. אם הרשומה חסרה או פגומה — נופלים חזרה
 * לתוכן ברירת המחדל, כדי שהאתר לעולם לא ייפול בגלל עריכה שגויה.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await prisma.siteContent.findUnique({
    where: { id: "singleton" },
  });

  if (!row) {
    return {
      content: defaultContent,
      landingEnabled: true,
      tosVersion: "1.0",
    };
  }

  const parsed = contentSchema.safeParse(row.data);

  if (!parsed.success) {
    console.error(
      "[site] תוכן האתר השמור אינו תקין, נטען תוכן ברירת מחדל:",
      parsed.error.issues,
    );
    return {
      content: defaultContent,
      landingEnabled: row.landingEnabled,
      tosVersion: row.tosVersion,
    };
  }

  return {
    content: parsed.data,
    landingEnabled: row.landingEnabled,
    tosVersion: row.tosVersion,
  };
}

export async function getActiveSlots() {
  return prisma.adSlot.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      sku: true,
      name: true,
      description: true,
      col: true,
      row: true,
      colSpan: true,
      rowSpan: true,
      widthCm: true,
      heightCm: true,
      priceAgorot: true,
      badge: true,
    },
  });
}

export type PublicSlot = Awaited<ReturnType<typeof getActiveSlots>>[number];

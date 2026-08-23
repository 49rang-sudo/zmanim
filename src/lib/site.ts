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

/**
 * לוח החלונות — תמונות ההשראה הפעילות והחלונות שעליהן.
 *
 * זו התבנית הגלובלית: אותן תמונות ואותם חלונות בכל עיר ובכל
 * מהדורה. מה שמשתנה בין מהדורות הוא רק *מי קנה מה*, וזה מגיע
 * בנפרד מ-getOpenEditionsForCity (occupiedSlotIds / soldBySlotId).
 *
 * מוחזרים רק חלונות פעילים שיש להם משבצת פעילה מקושרת — חלון בלי
 * משבצת אינו ניתן לרכישה, ואין טעם להציג אותו.
 */
export async function getInspirationBoard() {
  const images = await prisma.inspirationImage.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      label: true,
      imageUrl: true,
      aspectRatio: true,
      hotspots: {
        where: { active: true, slot: { isNot: null } },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          category: true,
          x: true,
          y: true,
          width: true,
          height: true,
          slot: {
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
              // המחיר הנגבה בפועל מגיע מהמשבצת, לא מהחלון —
              // מקור אמת אחד לכסף (ראו ההערה ב-Hotspot בסכמה).
              priceAgorot: true,
              badge: true,
              active: true,
            },
          },
        },
      },
    },
  });

  return images
    .map((image) => ({
      id: image.id,
      label: image.label,
      imageUrl: image.imageUrl,
      aspectRatio: image.aspectRatio,
      hotspots: image.hotspots
        .filter((h) => h.slot?.active)
        .map((h) => {
          const { active: _active, ...slot } = h.slot!;
          return {
            hotspotId: h.id,
            category: h.category,
            x: h.x,
            y: h.y,
            width: h.width,
            height: h.height,
            slot,
          };
        }),
    }))
    .filter((image) => image.hotspots.length > 0);
}

export type BoardImage = Awaited<ReturnType<typeof getInspirationBoard>>[number];
export type BoardHotspot = BoardImage["hotspots"][number];

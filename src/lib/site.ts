import { prisma } from "./prisma";
import { contentSchema, defaultContent, type SiteContentData } from "./content";
import type { PresenceTier } from "./packages";

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
 * לוח החלונות — סצנות הקונספט הפעילות והחלונות שעליהן.
 *
 * מוחזרות *כל* הסצנות, מכל החודשים, במכה אחת. הסינון לחודש עצמו
 * קורה בצד הלקוח (boardForMonth) כי דפדוף החודשים באשף הוא לקוחי
 * — כך אין קריאת רשת בכל הפיכת עמוד, והלוח נשאר מקור אמת אחד.
 *
 * מה שמשתנה בין *מהדורות של אותו חודש* הוא רק מי קנה מה, וזה מגיע
 * בנפרד מ-getOpenEditionsForCity (occupiedSlotIds / soldBySlotId).
 *
 * מוחזרים רק חלונות פעילים שיש להם משבצת פעילה מקושרת — חלון בלי
 * משבצת אינו ניתן לרכישה, ואין טעם להציג אותו.
 */
export async function getInspirationBoard() {
  const images = await prisma.inspirationImage.findMany({
    where: { active: true },
    orderBy: [{ gregorianMonth: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      label: true,
      gregorianMonth: true,
      imageUrl: true,
      aspectRatio: true,
      hotspots: {
        where: { active: true, slot: { isNot: null } },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          category: true,
          tier: true,
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
      /** null = סצנה כללית, גיבוי לחודשים שאין להם אמנות ייעודית */
      gregorianMonth: image.gregorianMonth,
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
            // הדרגה נשמרת על החלון, אבל היא נצרבת גם לתוך אובייקט
            // המשבצת שעובר דרך האשף (MockupSlot) — כך TierPicker,
            // TosDialog ו-OrderSummary מקבלים אותה בלי לגרור איתם
            // את החלון כולו, ואי אפשר לתמחר משבצת בלי לדעת דרגה.
            tier: h.tier as PresenceTier,
            slot: { ...slot, tier: h.tier as PresenceTier },
          };
        }),
    }))
    .filter((image) => image.hotspots.length > 0);
}

export type BoardImage = Awaited<ReturnType<typeof getInspirationBoard>>[number];
export type BoardHotspot = BoardImage["hotspots"][number];

/**
 * כלל בחירת הסצנה של חודש. מוגדר ב-src/lib/board.ts כדי שגם רכיבי
 * לקוח יוכלו לייבא אותו בלי לגרור את prisma לדפדפן.
 */
export { boardForMonth } from "./board";

import { prisma } from "./prisma";
import { safeEqual } from "./ids";
import type { SlotSelection } from "./availability";

export type SelectionDetail = SlotSelection & {
  editionLabel: string;
  gregorianMonth: number;
  gregorianYear: number;
  slotName: string;
  slotSku: string;
};

/**
 * מפענח את selections (JSON) של הזמנה אחת או יותר למידע מוצג —
 * שם/מק"ט המשבצת ותווית המהדורה לכל בחירה, בשאילתת batch אחת
 * לכל הזמנות ה-input יחד (לא שאילתה בלולאה).
 */
export async function resolveOrderSelections(
  orders: { id: string; selections: unknown }[],
): Promise<Map<string, SelectionDetail[]>> {
  const parsed = orders.map((o) => ({
    id: o.id,
    selections: ((o.selections as SlotSelection[] | null) ?? []),
  }));

  const editionIds = [
    ...new Set(parsed.flatMap((o) => o.selections.map((s) => s.editionId))),
  ];
  const slotIds = [
    ...new Set(parsed.flatMap((o) => o.selections.map((s) => s.slotId))),
  ];

  const [editions, slots] = await Promise.all([
    prisma.edition.findMany({
      where: { id: { in: editionIds } },
      select: {
        id: true,
        hebrewLabel: true,
        gregorianMonth: true,
        gregorianYear: true,
      },
    }),
    prisma.adSlot.findMany({
      where: { id: { in: slotIds } },
      select: { id: true, name: true, sku: true },
    }),
  ]);

  const editionMap = new Map(editions.map((e) => [e.id, e]));
  const slotMap = new Map(slots.map((s) => [s.id, s]));

  const result = new Map<string, SelectionDetail[]>();
  for (const order of parsed) {
    const details = order.selections
      .map((sel): SelectionDetail | null => {
        const edition = editionMap.get(sel.editionId);
        const slot = slotMap.get(sel.slotId);
        if (!edition || !slot) return null;
        return {
          ...sel,
          editionLabel: edition.hebrewLabel,
          gregorianMonth: edition.gregorianMonth,
          gregorianYear: edition.gregorianYear,
          slotName: slot.name,
          slotSku: slot.sku,
        };
      })
      .filter((d): d is SelectionDetail => d !== null);
    result.set(order.id, details);
  }
  return result;
}

/**
 * שולף הזמנה לפי מזהה + טוקן יכולת.
 * ההשוואה עמידה בפני התקפות תזמון, והכישלון תמיד אחיד —
 * הלקוח לא יכול להבדיל בין "הזמנה לא קיימת" ל"טוקן שגוי".
 */
export async function findOrderByToken(id: string, token: string | null) {
  if (!token) return null;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { slot: true, city: true, reservations: true },
  });

  if (!order) return null;
  if (!safeEqual(order.accessToken, token)) return null;

  return order;
}

export function extractOrderToken(request: Request): string | null {
  const header = request.headers.get("x-order-token");
  if (header) return header;
  return new URL(request.url).searchParams.get("token");
}

/** מצבים שבהם ההזמנה עדיין ניתנת לעריכה על ידי הלקוח */
export function isEditable(status: string): boolean {
  return status === "PENDING" || status === "AWAITING_PAYMENT";
}

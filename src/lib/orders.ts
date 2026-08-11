import { prisma } from "./prisma";
import { safeEqual } from "./ids";

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

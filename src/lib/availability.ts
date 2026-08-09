import { prisma } from "./prisma";
import { env } from "./env";

export type CityAvailability = {
  id: string;
  name: string;
  region: string | null;
  distribution: number | null;
  note: string | null;
  capacity: number;
  taken: number;
  remaining: number;
  isFull: boolean;
  available: boolean;
};

/**
 * משחרר החזקות שפגו ומסמן את ההזמנות שלהן כפוגות.
 * נקרא לפני כל בדיקת זמינות ולפני כל ניסיון תפיסה — כך שלקוח
 * שנטש בשלב התשלום לא תופס מקום במהדורה לנצח.
 */
export async function releaseExpiredHolds(): Promise<number> {
  const now = new Date();

  const expired = await prisma.slotReservation.findMany({
    where: { expiresAt: { not: null, lt: now } },
    select: { id: true, orderId: true },
  });

  if (expired.length === 0) return 0;

  await prisma.$transaction([
    prisma.order.updateMany({
      where: {
        id: { in: expired.map((r) => r.orderId) },
        status: { in: ["PENDING", "AWAITING_PAYMENT"] },
      },
      data: { status: "EXPIRED" },
    }),
    prisma.slotReservation.deleteMany({
      where: { id: { in: expired.map((r) => r.id) } },
    }),
  ]);

  return expired.length;
}

/**
 * זמינות לכל עיר. המלאי נספר ברמת העיר בלבד — אין מעקב אחרי
 * ריבוע בודד, כי העימוד הסופי ממזג ומזיז ריבועים.
 *
 * includeHidden מיועד ללוח הניהול, שרוצה לראות גם ערים מוסתרות.
 */
export async function getCityAvailability(
  includeHidden = false,
): Promise<CityAvailability[]> {
  await releaseExpiredHolds();

  const cities = await prisma.city.findMany({
    where: includeHidden ? {} : { visible: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { reservations: true } } },
  });

  const rows = cities.map((city) => {
    const taken = city._count.reservations;
    const isFull = taken >= city.capacity;

    return {
      id: city.id,
      name: city.name,
      region: city.region,
      distribution: city.distribution,
      note: city.note,
      capacity: city.capacity,
      taken,
      remaining: Math.max(0, city.capacity - taken),
      isFull,
      available: !isFull,
      autoHideWhenFull: city.autoHideWhenFull,
    };
  });

  if (includeHidden) {
    return rows.map(({ autoHideWhenFull: _hide, ...rest }) => rest);
  }

  // הסתרה אוטומטית: עיר מלאה שסומנה להסתרה נעלמת מהבורר.
  // עיר מלאה שלא סומנה — נשארת מוצגת ומנוטרלת, עם הסבר.
  return rows
    .filter((c) => !(c.isFull && c.autoHideWhenFull))
    .map(({ autoHideWhenFull: _hide, ...rest }) => rest);
}

export class SlotUnavailableError extends Error {
  constructor(public readonly reason: "CITY_FULL") {
    super(reason);
    this.name = "SlotUnavailableError";
  }
}

/**
 * תופס מקום במהדורה של העיר עבור הזמנה.
 *
 * `SELECT ... FOR UPDATE` נועל את שורת העיר עד סוף הטרנזקציה,
 * ולכן שתי בקשות מקבילות לאותה עיר נכנסות בתור ולא שתיהן
 * רואות את אותה ספירה. בלי הנעילה הזו אפשר היה לחרוג מהקיבולת,
 * כי אין יותר אינדקס ייחודי שיתפוס את המרוץ.
 */
export async function reserveSlot(
  cityId: string,
  slotId: string,
  orderId: string,
): Promise<Date> {
  await releaseExpiredHolds();

  const holdMinutes = env().SLOT_HOLD_MINUTES;
  const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ capacity: number }[]>`
      SELECT capacity FROM cities WHERE id = ${cityId} FOR UPDATE
    `;

    if (locked.length === 0) {
      throw new SlotUnavailableError("CITY_FULL");
    }

    const taken = await tx.slotReservation.count({ where: { cityId } });

    if (taken >= locked[0].capacity) {
      throw new SlotUnavailableError("CITY_FULL");
    }

    await tx.slotReservation.create({
      data: { cityId, slotId, orderId, expiresAt },
    });
  });

  return expiresAt;
}

export type ConfirmReservationResult =
  | { ok: true }
  | { ok: false; reason: "CITY_FULL" };

/**
 * הופך החזקה זמנית לתפיסה קבועה — נקרא רק אחרי אישור תשלום.
 *
 * מקרה קצה: אם התשלום אושר *אחרי* שההחזקה כבר פגה (למשל webhook
 * שהגיע באיחור אחרי SLOT_HOLD_MINUTES, או ניקוי ידני), אין יותר
 * שורת reservation לעדכן — updateMany היה מדווח הצלחה על 0 שורות
 * בשקט, וההזמנה הייתה מסומנת "שולם" בלי לתפוס מקום בכלל, מה
 * שמאפשר חריגה ממכסת העיר. לכן במקרה הזה תופסים מקום חדש וקבוע
 * מההתחלה, עם אותה נעילת שורת עיר שמונעת מרוץ. אם העיר כבר מלאה
 * (מישהו אחר תפס את המקום בינתיים) — מחזירים CITY_FULL כדי שהקורא
 * יסמן את ההזמנה לטיפול ידני; התשלום עצמו כבר בוצע ואי אפשר
 * "לבטל" אותו כאן.
 */
export async function confirmReservation(
  orderId: string,
  cityId: string,
  slotId: string,
): Promise<ConfirmReservationResult> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.slotReservation.updateMany({
      where: { orderId },
      data: { expiresAt: null },
    });

    if (updated.count > 0) {
      return { ok: true };
    }

    const locked = await tx.$queryRaw<{ capacity: number }[]>`
      SELECT capacity FROM cities WHERE id = ${cityId} FOR UPDATE
    `;
    if (locked.length === 0) {
      return { ok: false, reason: "CITY_FULL" };
    }

    const taken = await tx.slotReservation.count({ where: { cityId } });
    if (taken >= locked[0].capacity) {
      return { ok: false, reason: "CITY_FULL" };
    }

    await tx.slotReservation.create({
      data: { cityId, slotId, orderId, expiresAt: null },
    });
    return { ok: true };
  });
}

/** משחרר מקום — ביטול ידני בלוח הניהול */
export async function releaseReservation(orderId: string): Promise<void> {
  await prisma.slotReservation.deleteMany({ where: { orderId } });
}

import { prisma } from "./prisma";
import { env } from "./env";

/** בחירה בודדת בתוך הזמנה: איזו משבצת נבחרה באיזו מהדורה */
export type SlotSelection = { editionId: string; slotId: string };

export type EditionAvailability = {
  id: string;
  cityId: string;
  hebrewLabel: string;
  gregorianMonth: number;
  gregorianYear: number;
  closesAt: string;
  capacity: number;
  taken: number;
  remaining: number;
  isFull: boolean;
  status: "OPEN" | "CLOSED";
  /** מזהי המשבצות התפוסות (זמנית או קבוע) במהדורה הזו — לצביעת המוקאפ */
  occupiedSlotIds: string[];
  /**
   * slotId → שם העסק שקנה אותו, למשבצות *ששולמו בלבד*. זה מה
   * שגורם ללוח "להתמלא" לעיני המפרסמים הבאים.
   *
   * שתי הגבלות מכוונות:
   *  · רק PAID. החזקה זמנית של 30 דקות שאולי לא תשולם לעולם לא
   *    תציג שם עסק על הלוח הציבורי.
   *  · רק businessName. contactName הוא שם פרטי של אדם ואסור
   *    שידלוף לעמוד ציבורי — מי שלא מילא שם עסק נשאר "תפוס".
   */
  soldBySlotId: Record<string, string>;
  /** טקסט שיווקי קצר: למה כדאי לפרסם דווקא במהדורה הזו */
  marketingNote: string | null;
};

export type CityAvailability = {
  id: string;
  name: string;
  region: string | null;
  distribution: number | null;
  note: string | null;
  openEditionsCount: number;
  nearestEdition: {
    id: string;
    hebrewLabel: string;
    gregorianMonth: number;
    gregorianYear: number;
  } | null;
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
 * זמינות לכל עיר. המלאי נספר ברמת המהדורה (חודש ספציפי) — עיר
 * נחשבת זמינה אם יש לה לפחות מהדורה פתוחה אחת שאינה מלאה.
 * הפירוט המדויק לפי משבצת/מהדורה מגיע מ-getOpenEditionsForCity.
 *
 * includeHidden מיועד ללוח הניהול, שרוצה לראות גם ערים מוסתרות.
 */
export async function getCityAvailability(
  includeHidden = false,
): Promise<CityAvailability[]> {
  await releaseExpiredHolds();

  const now = new Date();

  const cities = await prisma.city.findMany({
    where: includeHidden ? {} : { visible: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      editions: {
        where: { status: "OPEN", closesAt: { gt: now } },
        orderBy: [{ gregorianYear: "asc" }, { gregorianMonth: "asc" }],
        include: { _count: { select: { reservations: true } } },
      },
    },
  });

  const rows = cities.map((city) => {
    const openEditions = city.editions.map((edition) => ({
      id: edition.id,
      hebrewLabel: edition.hebrewLabel,
      gregorianMonth: edition.gregorianMonth,
      gregorianYear: edition.gregorianYear,
      capacity: edition.capacity,
      taken: edition._count.reservations,
    }));

    const nearest =
      openEditions.find((e) => e.taken < e.capacity) ?? null;
    const isFull = nearest === null;

    return {
      id: city.id,
      name: city.name,
      region: city.region,
      distribution: city.distribution,
      note: city.note,
      openEditionsCount: openEditions.length,
      nearestEdition: nearest
        ? {
            id: nearest.id,
            hebrewLabel: nearest.hebrewLabel,
            gregorianMonth: nearest.gregorianMonth,
            gregorianYear: nearest.gregorianYear,
          }
        : null,
      capacity: nearest?.capacity ?? 0,
      taken: nearest?.taken ?? 0,
      remaining: nearest ? Math.max(0, nearest.capacity - nearest.taken) : 0,
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

/**
 * כל המהדורות הפתוחות של עיר, עם רשימת המשבצות התפוסות בכל אחת —
 * זה מה שמניע את דפדוף החודשים ואת צביעת המוקאפ באשף ההזמנה.
 */
export async function getOpenEditionsForCity(
  cityId: string,
): Promise<EditionAvailability[]> {
  const now = new Date();

  const editions = await prisma.edition.findMany({
    where: { cityId, status: "OPEN", closesAt: { gt: now } },
    orderBy: [{ gregorianYear: "asc" }, { gregorianMonth: "asc" }],
    include: {
      reservations: {
        select: {
          slotId: true,
          order: { select: { status: true, businessName: true } },
        },
      },
    },
  });

  return editions.map((edition) => {
    const occupiedSlotIds = edition.reservations.map((r) => r.slotId);
    const taken = occupiedSlotIds.length;

    const soldBySlotId: Record<string, string> = {};
    for (const reservation of edition.reservations) {
      const business = paidBusinessName(reservation.order);
      if (business) soldBySlotId[reservation.slotId] = business;
    }

    return {
      id: edition.id,
      cityId: edition.cityId,
      hebrewLabel: edition.hebrewLabel,
      gregorianMonth: edition.gregorianMonth,
      gregorianYear: edition.gregorianYear,
      closesAt: edition.closesAt.toISOString(),
      capacity: edition.capacity,
      taken,
      remaining: Math.max(0, edition.capacity - taken),
      isFull: taken >= edition.capacity,
      status: edition.status,
      occupiedSlotIds,
      soldBySlotId,
      marketingNote: edition.marketingNote,
    };
  });
}

/**
 * הכלל היחיד שקובע "מי מפרסם חי" במהדורה — מקור אמת אחד, כדי
 * שבורר החלונות (soldBySlotId למעלה) וטופס הקבלות הציבורי
 * (src/lib/receipts.ts) לעולם לא יראו רשימות שונות של עסקים.
 *
 * שתי ההגבלות זהות בשני המקומות:
 *  · רק PAID — החזקה זמנית שאולי לא תשולם לעולם אינה "מפרסם".
 *  · רק businessName — contactName הוא שם פרטי של אדם ואסור
 *    שידלוף לעמוד ציבורי.
 */
export function paidBusinessName(
  order: { status: string; businessName: string | null } | null | undefined,
): string | null {
  if (!order || order.status !== "PAID") return null;
  const name = order.businessName?.trim();
  return name ? name : null;
}

export class SlotUnavailableError extends Error {
  constructor(
    public readonly reason:
      | "EDITION_FULL"
      | "SLOT_TAKEN"
      | "EDITION_CLOSED"
      | "EDITION_NOT_FOUND",
  ) {
    super(reason);
    this.name = "SlotUnavailableError";
  }
}

/**
 * תופס את הבחירות שברשימה, אטומית — הכול או כלום. כל בחירה יכולה
 * להצביע על משבצת אחרת (אותו סוג/גודל, מיקום שונה בכל חודש — לא
 * חובה שתהיה אותה משבצת מדויקת). נועלים בדיוק את שורות ה-Edition
 * המעורבות, בסדר קבוע (ORDER BY id) כדי ששתי תפיסות מרובות-מהדורות
 * שחופפות תמיד ננעלות באותו סדר יחסי — כך אי אפשר להגיע למבוי סתום
 * (deadlock).
 */
export async function reserveSlot(
  cityId: string,
  selections: SlotSelection[],
  orderId: string,
): Promise<Date> {
  await releaseExpiredHolds();

  const holdMinutes = env().SLOT_HOLD_MINUTES;
  const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);
  const now = new Date();
  const editionIds = selections.map((s) => s.editionId);

  await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<
      { id: string; capacity: number; status: string; closesAt: Date }[]
    >`
      SELECT id, capacity, status, "closesAt"
      FROM editions
      WHERE id = ANY(${editionIds}) AND "cityId" = ${cityId}
      ORDER BY id
      FOR UPDATE
    `;

    if (locked.length !== editionIds.length) {
      throw new SlotUnavailableError("EDITION_NOT_FOUND");
    }

    if (locked.some((e) => e.status !== "OPEN" || e.closesAt <= now)) {
      throw new SlotUnavailableError("EDITION_CLOSED");
    }

    const existing = await tx.slotReservation.findMany({
      where: { editionId: { in: editionIds } },
      select: { editionId: true, slotId: true },
    });

    const takenPairs = new Set(
      existing.map((r) => `${r.editionId}:${r.slotId}`),
    );
    if (
      selections.some((s) => takenPairs.has(`${s.editionId}:${s.slotId}`))
    ) {
      throw new SlotUnavailableError("SLOT_TAKEN");
    }

    const takenCount = new Map<string, number>();
    for (const row of existing) {
      takenCount.set(row.editionId, (takenCount.get(row.editionId) ?? 0) + 1);
    }
    if (locked.some((e) => (takenCount.get(e.id) ?? 0) >= e.capacity)) {
      throw new SlotUnavailableError("EDITION_FULL");
    }

    await tx.slotReservation.createMany({
      data: selections.map(({ editionId, slotId }) => ({
        cityId,
        slotId,
        editionId,
        orderId,
        expiresAt,
      })),
    });
  });

  return expiresAt;
}

export type ConfirmReservationResult =
  | { ok: true }
  | { ok: false; reason: "PARTIAL_FAILURE"; failedEditionIds: string[] };

/**
 * הופך החזקות זמניות לתפיסות קבועות — נקרא רק אחרי אישור תשלום.
 *
 * מקרה קצה: אם התשלום אושר *אחרי* שהחזקה מסוימת כבר פגה (למשל
 * webhook שהגיע באיחור), אין יותר שורת reservation לאותה מהדורה.
 * במקרה הזה תופסים מקום קבוע מחדש רק למהדורות החסרות, כל אחת
 * בנפרד, תחת אותה נעילת שורת-Edition שמונעת מרוץ. בניגוד לתפיסה
 * הראשונית (reserveSlot, הכול-או-כלום), כאן מותר להצליח חלקית —
 * התשלום כבר בוצע ואי אפשר "לבטל" אותו, אז מהדורה שלא הצליחה
 * מסומנת לטיפול ידני ולא הופכת את כל האישור לכישלון.
 */
export async function confirmReservation(
  orderId: string,
  cityId: string,
  selections: SlotSelection[],
): Promise<ConfirmReservationResult> {
  const editionIds = selections.map((s) => s.editionId);
  const slotIdByEdition = new Map(
    selections.map((s) => [s.editionId, s.slotId]),
  );

  return prisma.$transaction(async (tx) => {
    const updated = await tx.slotReservation.updateMany({
      where: { orderId, editionId: { in: editionIds } },
      data: { expiresAt: null },
    });

    if (updated.count === editionIds.length) {
      return { ok: true };
    }

    const confirmedEditionIds = new Set(
      (
        await tx.slotReservation.findMany({
          where: { orderId, editionId: { in: editionIds } },
          select: { editionId: true },
        })
      ).map((r) => r.editionId),
    );
    const missingIds = editionIds.filter((id) => !confirmedEditionIds.has(id));

    const locked = await tx.$queryRaw<{ id: string; capacity: number }[]>`
      SELECT id, capacity FROM editions
      WHERE id = ANY(${missingIds}) AND "cityId" = ${cityId}
      ORDER BY id
      FOR UPDATE
    `;
    const lockedById = new Map(locked.map((e) => [e.id, e]));

    const failed: string[] = [];
    for (const editionId of missingIds) {
      const edition = lockedById.get(editionId);
      const slotId = slotIdByEdition.get(editionId);
      if (!edition || !slotId) {
        failed.push(editionId);
        continue;
      }

      const [alreadyTaken, taken] = await Promise.all([
        tx.slotReservation.findFirst({ where: { editionId, slotId } }),
        tx.slotReservation.count({ where: { editionId } }),
      ]);

      if (alreadyTaken || taken >= edition.capacity) {
        failed.push(editionId);
        continue;
      }

      await tx.slotReservation.create({
        data: { cityId, slotId, editionId, orderId, expiresAt: null },
      });
    }

    return failed.length === 0
      ? { ok: true }
      : { ok: false, reason: "PARTIAL_FAILURE", failedEditionIds: failed };
  });
}

/** משחרר מקום — ביטול ידני בלוח הניהול */
export async function releaseReservation(orderId: string): Promise<void> {
  await prisma.slotReservation.deleteMany({ where: { orderId } });
}

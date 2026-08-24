import { prisma } from "./prisma";
import { env } from "./env";
import type { PresenceTier } from "./packages";

/** בחירה בודדת בתוך הזמנה: איזו משבצת נבחרה באיזו מהדורה */
export type SlotSelection = { editionId: string; slotId: string };

/** מלאי של דרגה אחת (עוגן/משלים) בתוך מהדורה אחת */
export type TierAvailability = {
  capacity: number;
  taken: number;
  remaining: number;
  isFull: boolean;
};

export type TierAvailabilityMap = Record<PresenceTier, TierAvailability>;

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
  /**
   * מלאי נפרד לכל דרגה במהדורה הזו. שני המספרים בלתי-תלויים: אפשר
   * שכל העוגנים של החודש ייתפסו בזמן שהמשלימים עדיין פנויים,
   * ולהפך. זה מה שהבורר מציג כ"עוגן: נתפס · משלים: 3 מקומות".
   */
  tiers: TierAvailabilityMap;
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

/* ---------------------------------------------------------------
   תבנית החלונות הנמכרים, מקובצת לפי החודש שהסצנה שייכת לו.

   זה מה שהופך "מלאי" ממספר יחיד לשני מספרים בלתי-תלויים: לכל חודש
   סצנה משלו, ובתוכה קבוצת עוגנים וקבוצת משלימים נפרדות. אפשר שכל
   העוגנים של חודש ייתפסו בזמן שהמשלימים באותו חודש עדיין פנויים —
   ולהפך — כי הם פשוט נספרים משתי קבוצות שונות.
   --------------------------------------------------------------- */

type MonthTemplate = {
  /** מזהי המשבצות הנמכרות בחודש הזה, לפי דרגה */
  slotIdsByTier: Record<PresenceTier, Set<string>>;
  /** slotId → דרגה, לשיוך מהיר של תפיסה קיימת לדרגה */
  tierBySlotId: Map<string, PresenceTier>;
  /** סך המשבצות הניתנות למכירה בחודש הזה (שתי הדרגות יחד) */
  total: number;
};

type MonthTemplates = {
  byMonth: Map<number, MonthTemplate>;
  /** הסצנות הכלליות (gregorianMonth = null) — גיבוי לחודש בלי אמנות */
  fallback: MonthTemplate;
};

function emptyTemplate(): MonthTemplate {
  return {
    slotIdsByTier: { ANCHOR: new Set(), COMPLEMENTARY: new Set() },
    tierBySlotId: new Map(),
    total: 0,
  };
}

/**
 * טוען את תבנית החלונות הפעילים ומקבץ אותה לפי חודש.
 *
 * כלל הגיבוי כאן חייב להיות זהה לזה שהלקוח רואה בבורר
 * (boardForMonth ב-src/lib/board.ts): קודם הסצנות של החודש, ורק אם
 * אין כאלה — הכלליות. אם הספירה תשתמש בסצנה אחת והתצוגה באחרת,
 * המספר "3 מקומות פנויים" יתאר משהו שלא מוצג על המסך.
 */
async function loadMonthTemplates(): Promise<MonthTemplates> {
  const hotspots = await prisma.hotspot.findMany({
    where: {
      active: true,
      slot: { is: { active: true } },
      inspirationImage: { is: { active: true } },
    },
    select: {
      tier: true,
      inspirationImage: { select: { gregorianMonth: true } },
      slot: { select: { id: true } },
    },
  });

  const byMonth = new Map<number, MonthTemplate>();
  const fallback = emptyTemplate();

  for (const hotspot of hotspots) {
    if (!hotspot.slot) continue;

    const month = hotspot.inspirationImage.gregorianMonth;
    let bucket: MonthTemplate;
    if (month === null) {
      bucket = fallback;
    } else {
      bucket = byMonth.get(month) ?? emptyTemplate();
      byMonth.set(month, bucket);
    }

    const tier = hotspot.tier as PresenceTier;
    bucket.slotIdsByTier[tier].add(hotspot.slot.id);
    bucket.tierBySlotId.set(hotspot.slot.id, tier);
    bucket.total += 1;
  }

  return { byMonth, fallback };
}

function templateForMonth(
  templates: MonthTemplates,
  gregorianMonth: number,
): MonthTemplate {
  const exact = templates.byMonth.get(gregorianMonth);
  return exact && exact.total > 0 ? exact : templates.fallback;
}

/**
 * הקיבולת שבאמת ניתנת למכירה במהדורה.
 *
 * Edition.capacity הוא התקרה שהמנהלת קבעה, אבל הוא לא יכול להצדיק
 * מכירה של מה שלא קיים: אי אפשר למכור יותר חלונות מכמה שיש בסצנה
 * של אותו חודש. זה המשך ישיר של b4b3b1a — רק שעכשיו הספירה היא
 * לפי חודש ולא גלובלית, כי לכל חודש סצנה משלו.
 *
 * הכיוון חשוב: התצוגה תמיד ≤ מה שנעילת התפיסה ב-reserveSlot מרשה,
 * אף פעם לא להפך. לכן "מלא" בתצוגה לעולם לא סותר תפיסה שמצליחה.
 */
function sellableCapacity(
  editionCapacity: number,
  template: MonthTemplate,
): number {
  return template.total > 0
    ? Math.min(editionCapacity, template.total)
    : editionCapacity;
}

/**
 * שני מלאים בלתי-תלויים למהדורה אחת.
 *
 * מלאי הדרגה חסום בנוסף במה שנשאר במהדורה כולה, כדי שלא נבטיח
 * 3 משלימים פנויים במהדורה שנשאר בה מקום אחד בסך הכול.
 */
function tierAvailability(
  template: MonthTemplate,
  occupiedSlotIds: string[],
  editionRemaining: number,
): TierAvailabilityMap {
  const takenByTier: Record<PresenceTier, number> = {
    ANCHOR: 0,
    COMPLEMENTARY: 0,
  };

  for (const slotId of occupiedSlotIds) {
    const tier = template.tierBySlotId.get(slotId);
    // תפיסה על משבצת שאינה בסצנה של החודש (למשל אחרי החלפת אמנות)
    // נספרת בסך הכולל של המהדורה, אבל אין לה דרגה כאן — ולכן היא
    // לא מנפחת ולא מקטינה אף אחת משתי הדרגות.
    if (tier) takenByTier[tier] += 1;
  }

  const build = (tier: PresenceTier): TierAvailability => {
    const capacity = template.slotIdsByTier[tier].size;
    const taken = takenByTier[tier];
    const remaining = Math.min(
      Math.max(0, capacity - taken),
      Math.max(0, editionRemaining),
    );
    return { capacity, taken, remaining, isFull: remaining === 0 };
  };

  return { ANCHOR: build("ANCHOR"), COMPLEMENTARY: build("COMPLEMENTARY") };
}

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

  const [cities, templates] = await Promise.all([
    prisma.city.findMany({
      where: includeHidden ? {} : { visible: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        editions: {
          where: { status: "OPEN", closesAt: { gt: now } },
          orderBy: [{ gregorianYear: "asc" }, { gregorianMonth: "asc" }],
          include: { _count: { select: { reservations: true } } },
        },
      },
    }),
    loadMonthTemplates(),
  ]);

  const rows = cities.map((city) => {
    const openEditions = city.editions.map((edition) => ({
      id: edition.id,
      hebrewLabel: edition.hebrewLabel,
      gregorianMonth: edition.gregorianMonth,
      gregorianYear: edition.gregorianYear,
      // אותה תקרה שהבורר יראה — כרטיס העיר לא יכול להבטיח 14
      // מקומות בזמן שהסצנה של החודש נושאת 6 חלונות בלבד.
      capacity: sellableCapacity(
        edition.capacity,
        templateForMonth(templates, edition.gregorianMonth),
      ),
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

  const [editions, templates] = await Promise.all([
    prisma.edition.findMany({
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
    }),
    loadMonthTemplates(),
  ]);

  return editions.map((edition) => {
    const occupiedSlotIds = edition.reservations.map((r) => r.slotId);
    const taken = occupiedSlotIds.length;

    const soldBySlotId: Record<string, string> = {};
    for (const reservation of edition.reservations) {
      const business = paidBusinessName(reservation.order);
      if (business) soldBySlotId[reservation.slotId] = business;
    }

    const template = templateForMonth(templates, edition.gregorianMonth);
    const capacity = sellableCapacity(edition.capacity, template);
    const remaining = Math.max(0, capacity - taken);

    return {
      id: edition.id,
      cityId: edition.cityId,
      hebrewLabel: edition.hebrewLabel,
      gregorianMonth: edition.gregorianMonth,
      gregorianYear: edition.gregorianYear,
      closesAt: edition.closesAt.toISOString(),
      capacity,
      taken,
      remaining,
      isFull: remaining === 0,
      status: edition.status,
      occupiedSlotIds,
      soldBySlotId,
      tiers: tierAvailability(template, occupiedSlotIds, remaining),
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

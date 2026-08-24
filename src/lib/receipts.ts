import { prisma } from "./prisma";
import { paidBusinessName } from "./availability";

/* ---------------------------------------------------------------
   חלון הקבלות — "רק חודשים שעדיין פתוחים, עד תאריך מסוים"
   ---------------------------------------------------------------

   שימו לב: Edition.closesAt הוא מועד סגירת *המכירה* — עד מתי עסק
   יכול לקנות מקום ולהעלות קובץ לדפוס. הוא קודם להדפסה ולחלוקה,
   ולכן הוא בדיוק המועד ההפוך ממה שרלוונטי כאן: הקונה מעלה קבלה
   *אחרי* שהלוח כבר תלוי על הקיר.

   לכן החלון של הקבלות נגזר מחודש הדפוס עצמו (gregorianYear/
   gregorianMonth), ולא מ-closesAt:

     נפתח   — ב-1 בחודש שהלוח מתייחס אליו.
     נסגר   — בתום החודש + RECEIPT_GRACE_DAYS ימי חסד, כדי שמי
              שקנה ב-30 בחודש עדיין יספיק להעלות לפני ההגרלה.

   כך "החודש שעדיין פתוח" הוא תמיד לכל היותר החודש הנוכחי והחודש
   שזה עתה הסתיים — בלי להוסיף שדה חדש לסכמה.
   --------------------------------------------------------------- */

/** ימי חסד אחרי סוף חודש הדפוס שבהם עדיין אפשר להעלות קבלה */
export const RECEIPT_GRACE_DAYS = 10;

/** גודל מרבי לקובץ קבלה — צילום טלפון או סריקה, לא קובץ דפוס */
export const RECEIPT_MAX_MB = 12;

export type ReceiptMonth = { gregorianYear: number; gregorianMonth: number };

/**
 * החודשים שמקבלים קבלות ברגע נתון: תמיד החודש הנוכחי, ובנוסף
 * החודש הקודם כל עוד לא חלפו ימי החסד מאז שהסתיים.
 *
 * מוחזר כרשימה קצרה (1–2 פריטים) ולא כתנאי SQL, כי ככה הבדיקה
 * זהה בדיוק בשאילתה ובאימות השרת בהגשה — אין שתי הגדרות שיכולות
 * להיפרד זו מזו.
 */
export function eligibleReceiptMonths(now = new Date()): ReceiptMonth[] {
  const months: ReceiptMonth[] = [
    { gregorianYear: now.getFullYear(), gregorianMonth: now.getMonth() + 1 },
  ];

  if (now.getDate() <= RECEIPT_GRACE_DAYS) {
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    months.push({
      gregorianYear: previous.getFullYear(),
      gregorianMonth: previous.getMonth() + 1,
    });
  }

  return months;
}

export function isReceiptMonthOpen(
  edition: ReceiptMonth,
  now = new Date(),
): boolean {
  return eligibleReceiptMonths(now).some(
    (m) =>
      m.gregorianYear === edition.gregorianYear &&
      m.gregorianMonth === edition.gregorianMonth,
  );
}

/**
 * היום האחרון *כולל* שבו עדיין אפשר להעלות קבלה לחודש דפוס נתון.
 * יום ולא רגע, כי זה מה שמוצג לקונה ("אפשר להעלות עד 10 בספטמבר")
 * — וחייב להתאים בדיוק ל-eligibleReceiptMonths, שמפסיק לכלול את
 * החודש הקודם ביום שאחרי RECEIPT_GRACE_DAYS.
 */
export function receiptLastDay(edition: ReceiptMonth): Date {
  return new Date(
    edition.gregorianYear,
    edition.gregorianMonth, // החודש הבא (getMonth מבוסס-0)
    RECEIPT_GRACE_DAYS,
  );
}

/* ---------------------------------------------------------------
   מי מפרסם החודש — הנתונים שמניעים את הבורר בטופס הקבלות
   --------------------------------------------------------------- */

/**
 * עסק אחד שאפשר להעלות עבורו קבלה. orderId הוא היעד האמיתי:
 * הלקוחה אישרה מפורשות שקבלה נספרת רק אם היא מהעסק המפרסם עצמו,
 * ולכן ההגשה נקשרת להזמנה ספציפית ולא לקטגוריה.
 */
export type ReceiptBusiness = {
  orderId: string;
  businessName: string;
  /** ההטבה שהעסק הבטיח לקוני החודש — הטקסט שסביבו ההגרלה מתנהלת */
  monthlyBenefit: string | null;
};

export type ReceiptEdition = {
  id: string;
  hebrewLabel: string;
  gregorianMonth: number;
  gregorianYear: number;
  /** היום האחרון (כולל) שבו אפשר להעלות קבלות לחודש הזה */
  receiptsLastDay: string;
  businesses: ReceiptBusiness[];
};

export type ReceiptCity = {
  id: string;
  name: string;
  region: string | null;
  /** כמה עסקים מפרסמים סה"כ בחודשים הפתוחים של העיר */
  businessCount: number;
};

/**
 * המהדורות של עיר שמקבלות קבלות עכשיו, כולל העסקים שמפרסמים
 * בכל אחת. העסקים נגזרים מ-SlotReservation → Order, עם אותו כלל
 * בדיוק שמפעיל את soldBySlotId בבורר החלונות (paidBusinessName):
 * רק הזמנות ששולמו, ורק שם עסק.
 */
export async function getReceiptEditionsForCity(
  cityId: string,
  now = new Date(),
): Promise<ReceiptEdition[]> {
  const editions = await prisma.edition.findMany({
    where: { cityId, OR: eligibleReceiptMonths(now) },
    orderBy: [{ gregorianYear: "desc" }, { gregorianMonth: "desc" }],
    include: {
      reservations: {
        select: {
          order: {
            select: {
              id: true,
              status: true,
              businessName: true,
              monthlyBenefit: true,
            },
          },
        },
      },
    },
  });

  return editions
    .map((edition) => {
      const byOrderId = new Map<string, ReceiptBusiness>();

      for (const reservation of edition.reservations) {
        const businessName = paidBusinessName(reservation.order);
        if (!businessName || !reservation.order) continue;

        byOrderId.set(reservation.order.id, {
          orderId: reservation.order.id,
          businessName,
          monthlyBenefit: reservation.order.monthlyBenefit,
        });
      }

      return {
        id: edition.id,
        hebrewLabel: edition.hebrewLabel,
        gregorianMonth: edition.gregorianMonth,
        gregorianYear: edition.gregorianYear,
        receiptsLastDay: receiptLastDay(edition).toISOString(),
        businesses: [...byOrderId.values()].sort((a, b) =>
          a.businessName.localeCompare(b.businessName, "he"),
        ),
      };
    })
    // חודש בלי אף מפרסם משולם אינו אפשרות אמיתית — אין למי להעלות
    .filter((edition) => edition.businesses.length > 0);
}

/**
 * הערים שיש בהן בכלל למי להעלות קבלה החודש. עיר בלי מפרסם משולם
 * בחודש פתוח לא מוצגת — כדי שהקונה לא ייתקל במסך ריק אחרי בחירה.
 *
 * שימו לב: כאן *לא* מסננים לפי City.visible/autoHideWhenFull כמו
 * ב-getCityAvailability. שם ההסתרה נועדה לעצור *מכירות* חדשות;
 * כאן מדובר בלוח שכבר מודפס ותלוי על הקיר — קונה שמחזיק אותו
 * חייב להצליח להעלות קבלה גם אם העיר כבר נסגרה למכירה.
 */
export async function getReceiptCities(
  now = new Date(),
): Promise<ReceiptCity[]> {
  const cities = await prisma.city.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      region: true,
      editions: {
        where: { OR: eligibleReceiptMonths(now) },
        select: {
          reservations: {
            select: {
              order: { select: { id: true, status: true, businessName: true } },
            },
          },
        },
      },
    },
  });

  return cities
    .map((city) => {
      const orderIds = new Set<string>();

      for (const edition of city.editions) {
        for (const reservation of edition.reservations) {
          if (paidBusinessName(reservation.order) && reservation.order) {
            orderIds.add(reservation.order.id);
          }
        }
      }

      return {
        id: city.id,
        name: city.name,
        region: city.region,
        businessCount: orderIds.size,
      };
    })
    .filter((city) => city.businessCount > 0);
}

/**
 * מאמת שהזמנה נתונה באמת יכולה לקבל קבלה עכשיו — הבדיקה
 * הסמכותית בהגשה. לא סומכים על מה שהדפדפן שלח: גם אם הלקוח
 * מכיר orderId כלשהו, הוא ייפסל אם ההזמנה לא שולמה, אין לה שם
 * עסק, אין לה תפיסה קבועה באף חודש פתוח, או שההגרלה כבר בוצעה.
 */
export type ReceiptTarget =
  | { ok: true; orderId: string; reference: string; businessName: string }
  | {
      ok: false;
      reason: "NOT_FOUND" | "NOT_PAID" | "MONTH_CLOSED" | "RAFFLE_DONE";
    };

export async function resolveReceiptTarget(
  orderId: string,
  now = new Date(),
): Promise<ReceiptTarget> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      reference: true,
      status: true,
      businessName: true,
      reservations: {
        select: {
          expiresAt: true,
          edition: {
            select: { gregorianYear: true, gregorianMonth: true },
          },
        },
      },
      _count: { select: { raffleDraws: true } },
    },
  });

  if (!order) return { ok: false, reason: "NOT_FOUND" };

  const businessName = paidBusinessName(order);
  if (!businessName) return { ok: false, reason: "NOT_PAID" };

  // ההגרלה כבר רצה על ההזמנה הזו (שלב 3) — סגירת הפול, אחרת
  // הדוח למפרסם והזוכה שכבר הוכרז לא יתאימו למה שבמסד.
  if (order._count.raffleDraws > 0) return { ok: false, reason: "RAFFLE_DONE" };

  // רק תפיסה קבועה (expiresAt = null) נחשבת — בדיוק כמו בלוח.
  const live = order.reservations.some(
    (r) => r.expiresAt === null && isReceiptMonthOpen(r.edition, now),
  );
  if (!live) return { ok: false, reason: "MONTH_CLOSED" };

  return { ok: true, orderId: order.id, reference: order.reference, businessName };
}

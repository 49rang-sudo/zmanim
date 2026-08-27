"use client";

/* ===============================================================
   מאחז המודל של אשף ההזמנה.

   האשף עצמו (OrderWizard.tsx) לא זז ולא השתנה — כל הלוגיקה, כל
   קריאות ה-API, כל מכונת המצבים שלו נשארים בדיוק כפי שהיו. מה
   שהשתנה הוא רק *המכולה*: קודם הוא ישב תמיד בקטע קבוע בעמוד
   (<section id="order">), ועכשיו הוא נטען רק כשמבקשים אותו, בתוך
   ה-Dialog הקיים (src/components/ui/dialog.tsx) — בדיוק כמו
   ReservationModal.jsx ב-Base44.

   פתיחה נדרשת דרך שני ערוצים בלבד, שניהם כבר קיימים ב-
   src/lib/order-focus.ts:

   1. אירוע ORDER_OPEN_EVENT — כפתורי העמוד (OrderCta, לחיצה על
      חלון פנוי ב-CalendarBrowser) מבקשים פתיחה דרכו, עם דרגה
      אופציונלית. ה-tier מודלף הלאה ל-announceOrderIntent רק אחרי
      שה-state open כבר עלה — react מריץ effects של ילדים (האשף)
      לפני effects של ההורה (כאן) באותו commit, כך שהאשף כבר
      מאזין ל-ORDER_INTENT_EVENT ברגע שהאירוע נשלח.

   2. `#order` בכתובת בטעינת הדף — מגיע מניווט מעמוד אחר שאין בו
      את המודל (SiteHeader מופיע גם ב-/receipts וב-
      /order/[reference]); שם הכפתור פשוט מנווט הביתה עם העוגן,
      וכאן פותחים את המודל במקום להסתמך על עוגן שכבר לא קיים.

   האשף עצמו נטען/נפרק מחדש בכל פתיחה/סגירה (בדיוק כמו ב-Base44) —
   וזה בטוח כי הוא כבר יודע לשחזר את עצמו מטיוטה
   (src/lib/order-draft.ts): רענון עמוד תמיד עשה את אותו הדבר.
   =============================================================== */

import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { OrderWizard } from "@/components/wizard/OrderWizard";
import type { BoardImage } from "@/components/wizard/CalendarMockup";
import {
  announceOrderIntent,
  consumeOrderHash,
  ORDER_OPEN_EVENT,
  type OrderOpenDetail,
} from "@/lib/order-focus";
import type { SiteContentData } from "@/lib/content";
import type { PresenceTier } from "@/lib/packages";

type Props = {
  board: BoardImage[];
  content: SiteContentData;
  maxUploadMb: number;
  sumitCompanyId: number | null;
  sumitApiPublicKey: string | null;
};

export function OrderModalHost({
  board,
  content,
  maxUploadMb,
  sumitCompanyId,
  sumitApiPublicKey,
}: Props) {
  const [open, setOpen] = React.useState(false);
  /** דרגה שממתינה להימסר לאשף — רק אחרי שהוא בפועל נטען */
  const [pendingTier, setPendingTier] = React.useState<PresenceTier | null>(
    null,
  );

  // ניווט מעמוד אחר עם #order בכתובת — פותחים מיד בעליית העמוד
  React.useEffect(() => {
    if (consumeOrderHash()) setOpen(true);
  }, []);

  React.useEffect(() => {
    const onOpenRequest = (event: Event) => {
      const { tier } = (event as CustomEvent<OrderOpenDetail>).detail ?? {
        tier: null,
      };
      setPendingTier(tier ?? null);
      setOpen(true);
    };

    window.addEventListener(ORDER_OPEN_EVENT, onOpenRequest);
    return () => window.removeEventListener(ORDER_OPEN_EVENT, onOpenRequest);
  }, []);

  // נשלח רק אחרי שהמודל פתוח בפועל — כלומר אחרי שהאשף כבר נטען
  // ומאזין ל-ORDER_INTENT_EVENT (ראו הערה למעלה על סדר ה-effects)
  React.useEffect(() => {
    if (!open || !pendingTier) return;
    announceOrderIntent(pendingTier);
    setPendingTier(null);
  }, [open, pendingTier]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[min(96vw,1040px)] max-w-none">
        {/* כותרת נגישה בלבד — האשף כבר מציג כותרת גלויה משלו לכל
            שלב (StepHeading, מתוך content.wizard.*), אז אין צורך
            לכפול אותה כאן. משתמשים בקופי אמיתי קיים ולא ממציאים חדש. */}
        <DialogTitle className="sr-only">
          {content.landing.nav.cta}
        </DialogTitle>

        {open ? (
          <div className="p-6 pt-14">
            <OrderWizard
              board={board}
              content={content}
              maxUploadMb={maxUploadMb}
              sumitCompanyId={sumitCompanyId}
              sumitApiPublicKey={sumitApiPublicKey}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

import { Flame } from "lucide-react";
import { OrderCta } from "./OrderCta";
import type { LandingMonth } from "@/lib/landing-shared";
import type { PresenceTier } from "@/lib/packages";

/* ===============================================================
   "מה עוד פנוי עכשיו" — פורט מבני מ-InventoryStrip.jsx.

   בניגוד למקור בבייס44 — שסופר זמינות מ-AdPosition-ים בטבלה שטוחה,
   עם נפילה-חזרה שברירית לשדות anchor_taken/complementary_taken
   שאף פעם לא נכתבים בפועל שם (באג אמיתי שאותר בזמן המיגרציה הזו,
   לא מועתק) — כאן לא מחושבת שום זמינות ברכיב עצמו. הרכיב רק קורא
   את tiers.{ANCHOR,COMPLEMENTARY}.remaining שכבר מגיע מוכן מ-
   LandingMonth (src/lib/landing-shared.ts / getLandingData), מגובה
   שריונים אמיתיים (SlotReservation) — אותו landing.months בדיוק
   שכבר מוזרם ל-CalendarBrowser ב-page.tsx.

   קליק על כרטיס לא ממציא מנגנון "קפיצה לחודש נבחר" באשף — כזה לא
   קיים (נבדק ב-src/lib/order-focus.ts / order-draft.ts: האשף הוא
   city-first, ואין נקודת חיבור לבחירת edition-מראש מבחוץ). במקום
   זאת נעשה שימוש ב-OrderCta הקיים בדיוק כמו בשאר העמוד — גלילה ל-
   #order, עם הודעת דרגה (tier) רק כשלחודש הזה יש בדיוק דרגה אחת
   פנויה (חד-משמעי); כששתיהן פנויות לא נכפית כוונה.
   =============================================================== */

type Row = {
  editionId: string;
  hebrewLabel: string;
  conceptTitle: string;
  anchorRemaining: number;
  complementaryRemaining: number;
};

function dominantTier(row: Row): PresenceTier | undefined {
  const hasAnchor = row.anchorRemaining > 0;
  const hasComplementary = row.complementaryRemaining > 0;
  if (hasAnchor && !hasComplementary) return "ANCHOR";
  if (hasComplementary && !hasAnchor) return "COMPLEMENTARY";
  return undefined;
}

export function InventoryStrip({ months }: { months: LandingMonth[] }) {
  const rows: Row[] = months
    .map((month) => ({
      editionId: month.editionId,
      hebrewLabel: month.hebrewLabel,
      conceptTitle: month.conceptTitle,
      anchorRemaining: month.tiers.ANCHOR.remaining,
      complementaryRemaining: month.tiers.COMPLEMENTARY.remaining,
    }))
    // רק חודשים עם מקום פנוי כלשהו — "מה עוד פנוי", לא "מה כבר נגמר"
    .filter((row) => row.anchorRemaining + row.complementaryRemaining > 0)
    // הכי דחוף (הכי מעט מקומות) קודם — תחושת מלאי אמיתית
    .sort(
      (a, b) =>
        a.anchorRemaining +
        a.complementaryRemaining -
        (b.anchorRemaining + b.complementaryRemaining),
    )
    .slice(0, 6);

  if (rows.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="mb-5 flex items-center justify-center gap-2 text-sm font-bold text-primary">
        <Flame className="h-4 w-4" />
        מה עוד פנוי עכשיו
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <OrderCta
            key={row.editionId}
            href="#order"
            tier={dominantTier(row)}
            className="hover-lift block rounded-2xl border border-border bg-card p-4 text-right soft-shadow transition-colors hover:border-primary"
          >
            <div className="font-heading text-base font-bold">{row.hebrewLabel}</div>
            <div className="mt-0.5 truncate text-sm text-muted-foreground-strong">
              {row.conceptTitle}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {row.anchorRemaining > 0 ? (
                <span className="rounded-full bg-primary/15 px-3 py-1 font-bold text-primary">
                  נותרו {row.anchorRemaining} מקומות עוגן
                </span>
              ) : null}
              {row.complementaryRemaining > 0 ? (
                <span className="rounded-full bg-secondary px-3 py-1 font-bold text-secondary-foreground">
                  {row.complementaryRemaining} מקומות משלימים
                </span>
              ) : null}
            </div>
          </OrderCta>
        ))}
      </div>
    </div>
  );
}

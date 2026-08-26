"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check, MousePointerClick, Sparkles } from "lucide-react";
import { cn, formatCm, formatPrice } from "@/lib/utils";
import {
  packageTotalAgorotForEditions,
  TIER_DESCRIPTIONS,
  TIER_LABELS,
  type PresenceTier,
} from "@/lib/packages";
import { boardForMonth } from "@/lib/board";
import type { SiteContentData } from "@/lib/content";
import type { EditionAvailability, TierAvailability } from "@/lib/availability";
import type { BoardHotspot, BoardImage } from "@/lib/site";
import { Badge } from "@/components/ui/primitives";
import { MonthSheet } from "./MonthSheet";

export type MockupSlot = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  widthCm: number;
  heightCm: number;
  priceAgorot: number;
  badge: string | null;
  /** דרגת הנוכחות — עוגן או משלים. נצרבת מהחלון (ראו src/lib/site.ts) */
  tier: PresenceTier;
};

export type { BoardHotspot, BoardImage };

/**
 * "אותו סוג" = אותו גודל פיזי *ואותה דרגה* — קובע אילו מקומות
 * מתאימים זה לזה לחבילה רב-חודשית. הדרגה נכללת כי היא קלט תמחור:
 * חבילה מעורבת (עוגן בחודש אחד, משלים באחר) הייתה מתומחרת כולה
 * בסולם של הראשון. אותה בדיקה בדיוק נאכפת שוב בשרת
 * (src/app/api/orders/route.ts, TIER_MISMATCH).
 */
export function isSameType(a: MockupSlot, b: MockupSlot): boolean {
  return (
    a.tier === b.tier &&
    a.colSpan === b.colSpan &&
    a.rowSpan === b.rowSpan &&
    a.widthCm === b.widthCm &&
    a.heightCm === b.heightCm
  );
}

type Props = {
  /** כל סצנות הקונספט, מכל החודשים — הסינון לחודש קורה כאן */
  board: BoardImage[];
  calendar: SiteContentData["calendar"];
  /** מהדורות פתוחות של העיר שנבחרה — מניעות את הדפדוף בין החודשים */
  editions: EditionAvailability[];
  viewedEditionId: string | null;
  onViewedEditionChange: (id: string) => void;
  /** המקום שקבע את "הסוג" (גודל + דרגה) הנרכש — null לפני הבחירה הראשונה */
  anchorSlot: MockupSlot | null;
  /** כמה חודשים בסך הכול צריך לבחור (דרגת החבילה) — null עד שנבחרה */
  targetCount: number | null;
  /** הבחירה בפועל לכל מהדורה: editionId -> המקום שנבחר בה */
  selections: Record<string, MockupSlot>;
  onSelect: (slot: MockupSlot) => void;
};

/* ---------------------------------------------------------------
   שטח המכירה הוא סצנת הקונספט של החודש, לא רשת ריבועים.

   לכל חודש סצנה משלו (אלול "שיפוץ הבית", תשרי "לימודים
   והתפתחות"…). דפדוף בין החודשים מחליף את הסצנה כולה, ולכן התמונה
   מוצגת אחת, גדולה ומרכזית — בקשה מפורשת ונחרצת של הלקוחה: לא
   רשת צפופה של מודעות קטנות.

   על כל סצנה שני סוגי מקומות:
    · עוגן   — האלמנט המרכזי בתמונה, שטח גדול, מחיר גבוה.
    · משלים — מוצר בודד בתוך הסצנה, שטח קטן, מחיר נמוך.
   שניהם חלונות ממוקמים ממש על התמונה (אחוזים, כדי להישאר מוצמדים
   לנקודה בכל רוחב מסך), והמלאי שלהם נספר בנפרד לגמרי: אפשר שכל
   העוגנים של החודש נתפסו בזמן שהמשלימים עדיין פנויים.

   מקום פנוי אומר למי הוא שמור ומה מחירו. מקום שנמכר ושולם מציג את
   שם העסק שקנה — כך הלוח "מתמלא" לעיני המפרסמים הבאים.
   --------------------------------------------------------------- */

const TIER_ORDER: PresenceTier[] = ["ANCHOR", "COMPLEMENTARY"];

export function CalendarMockup({
  board,
  calendar,
  editions,
  viewedEditionId,
  onViewedEditionChange,
  anchorSlot,
  targetCount,
  selections,
  onSelect,
}: Props) {
  const [hovered, setHovered] = React.useState<string | null>(null);

  const viewedIndex = editions.findIndex((e) => e.id === viewedEditionId);
  const viewedEdition = viewedIndex >= 0 ? editions[viewedIndex] : null;
  const viewedMonth = viewedEdition?.gregorianMonth ?? null;

  // סצנות החודש הנצפה בלבד — אותו כלל בדיוק שבו נספר המלאי בשרת
  // (loadMonthTemplates ב-src/lib/availability.ts). לפני שנבחרה עיר
  // עדיין אין מהדורה, ואז מוצגות הסצנות הכלליות כתצוגה מקדימה.
  const monthBoard = React.useMemo(
    () => boardForMonth(board, viewedMonth),
    [board, viewedMonth],
  );

  const allHotspots = React.useMemo(
    () => monthBoard.flatMap((image) => image.hotspots),
    [monthBoard],
  );

  // מעבר חודש מחליף את הסצנה כולה — חלון שריחפו עליו בחודש הקודם
  // כבר לא קיים, ואסור שהחלונית תמשיך להציג אותו.
  React.useEffect(() => {
    setHovered(null);
  }, [viewedEditionId]);

  const occupiedSet = React.useMemo(
    () => new Set(viewedEdition?.occupiedSlotIds ?? []),
    [viewedEdition],
  );
  const soldBySlotId = viewedEdition?.soldBySlotId ?? {};
  // המקום שכבר נבחר עבור החודש שמוצג כרגע (אם בכלל)
  const pickedForViewedMonth = viewedEditionId
    ? selections[viewedEditionId]
    : undefined;

  // הפוקוס עוקב אחרי החלון שמרחפים עליו, ובהיעדר ריחוף — אחרי
  // הבחירה של החודש הנצפה, כדי שהחלונית לא תתרוקן סתם.
  const focusedHotspot: BoardHotspot | null =
    allHotspots.find((h) => h.hotspotId === hovered) ??
    allHotspots.find((h) => h.slot.id === pickedForViewedMonth?.id) ??
    null;
  const focused = focusedHotspot?.slot ?? null;
  const focusedIsPicked = !!focused && focused.id === pickedForViewedMonth?.id;
  const focusedOccupied = focused
    ? occupiedSet.has(focused.id) && !focusedIsPicked
    : false;
  const focusedEligible = !!(
    focused &&
    anchorSlot &&
    targetCount &&
    !focusedOccupied &&
    !focusedIsPicked &&
    isSameType(anchorSlot, focused)
  );
  const focusedWrongType = !!(
    focused &&
    anchorSlot &&
    targetCount &&
    !isSameType(anchorSlot, focused) &&
    !focusedIsPicked
  );

  // לתצוגת לוח השנה בחצי התחתון — עוקב אחרי החודש שמוצג בפועל
  // (viewedEdition) במקום התוכן השיווקי הסטטי, כדי שלא יסתרו זה
  // את זה. חוזר לברירת המחדל הסטטית רק אם עדיין לא נטענו מהדורות.
  const displayCalendar = viewedEdition
    ? {
        ...calendar,
        monthLabel: viewedEdition.hebrewLabel,
        yearLabel: "",
        gregorianMonth: viewedEdition.gregorianMonth,
        gregorianYear: viewedEdition.gregorianYear,
      }
    : calendar;

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[12px] text-muted">
        <MousePointerClick className="size-3.5 shrink-0" />
        לחצו על מקום פנוי בתמונה כדי לשריין אותו לעסק שלכם
      </p>

      {editions.length > 0 ? (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface-2 px-3 py-2.5 soft-shadow">
          <button
            type="button"
            disabled={viewedIndex <= 0}
            onClick={() =>
              viewedIndex > 0 &&
              onViewedEditionChange(editions[viewedIndex - 1].id)
            }
            aria-label="חודש קודם"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-e1",
              "transition-[transform,background-color,border-color] duration-150 ease-smooth",
              "hover:-translate-x-0.5 hover:border-accent hover:text-accent",
              "disabled:pointer-events-none disabled:opacity-30",
            )}
          >
            <ArrowRight className="size-4" />
          </button>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="font-display text-[15px] font-bold text-ink">
              {viewedEdition?.hebrewLabel ?? "—"}
            </span>

            {/* ====== מלאי נפרד לכל דרגה ======
                בכוונה שני מספרים ולא אחד מאוחד: "5 פנויות" היה מסתיר
                שכל העוגנים כבר נמכרו. המפרסם צריך לדעת מה *הוא* יכול
                לקנות, לא כמה מקומות נשארו בסך הכול. */}
            {viewedEdition ? (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {TIER_ORDER.map((tier) => (
                  <TierStatusBadge
                    key={tier}
                    tier={tier}
                    availability={viewedEdition.tiers?.[tier]}
                  />
                ))}
              </div>
            ) : null}

            {/* נקודות מיקום — "יש עוד עמודים, אפשר לדפדף" במבט אחד */}
            {editions.length > 1 ? (
              <div className="flex items-center gap-1.5">
                {editions.map((edition, i) => (
                  <button
                    key={edition.id}
                    type="button"
                    onClick={() => onViewedEditionChange(edition.id)}
                    aria-label={edition.hebrewLabel}
                    aria-current={i === viewedIndex}
                    className={cn(
                      "rounded-full transition-[width,background-color] duration-200 ease-smooth",
                      i === viewedIndex
                        ? "h-1.5 w-4 bg-accent"
                        : "size-1.5 bg-line-2 hover:bg-muted",
                    )}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            disabled={viewedIndex < 0 || viewedIndex >= editions.length - 1}
            onClick={() =>
              viewedIndex >= 0 &&
              viewedIndex < editions.length - 1 &&
              onViewedEditionChange(editions[viewedIndex + 1].id)
            }
            aria-label="חודש הבא"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-e1",
              "transition-[transform,background-color,border-color] duration-150 ease-smooth",
              "hover:translate-x-0.5 hover:border-accent hover:text-accent",
              "disabled:pointer-events-none disabled:opacity-30",
            )}
          >
            <ArrowLeft className="size-4" />
          </button>
        </div>
      ) : null}

      {viewedEdition?.marketingNote ? (
        <p className="mb-3 flex items-start gap-2 rounded-md border border-accent/30 bg-accent-soft px-3 py-2 text-[12.5px] leading-relaxed text-accent-strong">
          <Sparkles className="mt-0.5 size-3.5 shrink-0" />
          {viewedEdition.marketingNote}
        </p>
      ) : null}

      {/* עוטף ברוחב זהה בול לדף (mx-auto + max-w זהה) כדי שהחלונית
          תתיישר איתו. הגיליון מתרחב רק מ-xl ומעלה: מתחת לזה אין
          מספיק שוליים לחלונית הצפה (260px + מרווח) והיא הייתה
          נדחפת מחוץ למסך. */}
      <div className="relative mx-auto w-full max-w-[680px] xl:max-w-[820px]">
        {/* ============ חלון צף — הסכום והמעבר להזמנה ============
            top-0 מיישר אותו בול לגובה החלק העליון של הדף
            ("מקביל ללוח"), וה-end בערך calc דוחף אותו כולו החוצה,
            צמוד לשוליים החיצוניים — לא מכסה אף מקום. */}
        <div
          aria-hidden={!focused}
          className={cn(
            "pointer-events-none absolute top-0 end-[calc(100%+1rem)] z-40 w-[260px]",
            "transition-[opacity,transform] duration-200 ease-smooth",
            focused ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
          )}
        >
          <div
            className={cn(
              "rounded-2xl border border-line bg-surface p-5 soft-shadow",
              focused ? "pointer-events-auto" : "",
            )}
          >
            {focused && focusedHotspot ? (
              <FocusPanel
                slot={focused}
                category={focusedHotspot.category}
                soldTo={soldBySlotId[focused.id] ?? null}
                isPicked={focusedIsPicked}
                isOccupied={focusedOccupied}
                isEligible={focusedEligible}
                isWrongType={focusedWrongType}
                onSelect={() => onSelect(focused)}
              />
            ) : null}
          </div>
        </div>

        {editions.length > 1 ? (
          <>
            {/* ====== "ערימת עמודים" מאחורי הגיליון — רומזת שיש עוד
                חודשים לדפדוף לפני שבכלל נוגעים בחצים ====== */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-3 -bottom-1.5 top-2.5 -z-10 rounded-lg border sm:inset-x-4"
              style={{
                borderColor: "var(--color-paper-line-2)",
                background: "var(--color-paper-2)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-6 -bottom-3 top-5 -z-20 rounded-lg border sm:inset-x-8"
              style={{
                borderColor: "var(--color-paper-line)",
                background: "var(--color-paper-3)",
              }}
            />
          </>
        ) : null}

        <div className="pb-2">
            {/* --- סרט הדבקה — מדמה דף לוח תלוי, כמו על קיר אמיתי --- */}
            <div
              aria-hidden
              className="absolute -top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-sm bg-[color-mix(in_srgb,var(--color-paper-line-2)_70%,transparent)] shadow-e1"
            />

            {/* --- גיליון הלוח — נייר אמיתי, קבוע לבן ללא קשר לערכת הנושא ---
                אין יחס A4 קבוע: הגובה נקבע מסצנת החודש עצמה. --- */}
            <div
              className={cn(
                "paper relative mx-auto flex w-full max-w-[680px] flex-col xl:max-w-[820px]",
                "rounded-lg p-3 shadow-e3 ring-1 ring-[--color-paper-line-2]/60 sm:p-4",
              )}
              onMouseLeave={() => setHovered(null)}
            >
              {/* מפתח לפי המהדורה הנצפית — כשעוברים חודש, התוכן דוהה
                  ונכנס מחדש, כדי שהדפדוף ירגיש כמו הפיכת עמוד בפועל
                  ולא רק החלפת טקסט יבשה. */}
              <div
                key={viewedEditionId ?? "static"}
                className="flex min-h-0 flex-1 flex-col animate-[fade-in_0.35s_ease-out_both]"
              >
              {/* ====== אזור המפרסמים — סצנת הקונספט של החודש ====== */}
              <div className="flex flex-col gap-4">
                {monthBoard.length === 0 ? (
                  <div
                    className="rounded-[4px] border border-dashed p-8 text-center text-[12px]"
                    style={{
                      borderColor: "var(--color-paper-line-2)",
                      color: "var(--color-paper-muted)",
                    }}
                  >
                    עדיין לא הוגדרה סצנת קונספט לחודש הזה.
                  </div>
                ) : null}

                {monthBoard.map((image, imageIndex) => (
                  <figure key={image.id} className="m-0">
                    {/* כותרת הסצנה — הקונספט של החודש הוא הגיבור של
                        המסך, לא הערת שוליים בגודל 10px. */}
                    <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span
                          className="text-[9.5px] uppercase tracking-[0.18em]"
                          style={{ color: "var(--color-paper-muted)" }}
                        >
                          הקונספט של החודש
                        </span>
                        <span
                          className="font-display text-[17px] font-bold leading-tight sm:text-[19px]"
                          style={{ color: "var(--color-paper-ink)" }}
                        >
                          {image.label}
                        </span>
                      </span>
                      <span
                        className="tnum text-[10px]"
                        style={{ color: "var(--color-paper-muted)" }}
                      >
                        {countTier(image, "ANCHOR")} עוגן ·{" "}
                        {countTier(image, "COMPLEMENTARY")} משלים
                      </span>
                    </figcaption>

                    {/* יחס הגובה-רוחב שמור מראש כדי שהחלונות לא יזוזו
                        בזמן טעינת התמונה. min-h מבטיח שהסצנה נשארת
                        נוכחות גדולה גם בתמונה רחבה במיוחד. */}
                    <div
                      className="relative w-full overflow-hidden rounded-[4px] border"
                      style={{
                        aspectRatio: `${image.aspectRatio}`,
                        minHeight: "270px",
                        borderColor: "var(--color-paper-line-2)",
                        background: "var(--color-paper-2)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.imageUrl}
                        alt={image.label}
                        className="absolute inset-0 size-full object-cover"
                        loading={imageIndex === 0 ? "eager" : "lazy"}
                      />

                      {image.hotspots.map((spot, index) => {
                        const slot = spot.slot;
                        const isPicked = pickedForViewedMonth?.id === slot.id;
                        const isOccupied = occupiedSet.has(slot.id) && !isPicked;
                        const soldTo = soldBySlotId[slot.id] ?? null;
                        // "מתאים" = אותו גודל *ואותה דרגה* כמו העוגן,
                        // פנוי, ולא כבר הבחירה של החודש הזה
                        const isEligible =
                          !!anchorSlot &&
                          !!targetCount &&
                          !isOccupied &&
                          !isPicked &&
                          isSameType(anchorSlot, slot);
                        const isAnchorTier = spot.tier === "ANCHOR";

                        return (
                          <button
                            key={spot.hotspotId}
                            type="button"
                            onClick={() => {
                              if (isOccupied) return;
                              onSelect(slot);
                            }}
                            onMouseEnter={() => setHovered(spot.hotspotId)}
                            onFocus={() => setHovered(spot.hotspotId)}
                            onBlur={() => setHovered(null)}
                            aria-disabled={isOccupied}
                            aria-label={
                              soldTo
                                ? `${TIER_LABELS[spot.tier]} — ${spot.category} — נמכר ל${soldTo}`
                                : isOccupied
                                  ? `${TIER_LABELS[spot.tier]} — ${spot.category} — תפוס במהדורה זו`
                                  : `${TIER_LABELS[spot.tier]} — מקום זה שמור ל${spot.category}, ${formatPrice(slot.priceAgorot)} — לחצו להזמנה`
                            }
                            style={{
                              position: "absolute",
                              // אחוזים בלבד — נשאר מוצמד לנקודה בתמונה
                              insetInlineStart: `${spot.x}%`,
                              top: `${spot.y}%`,
                              width: `${spot.width}%`,
                              height: `${spot.height}%`,
                              animationDelay: `${index * 45}ms`,
                              borderColor:
                                isPicked || isEligible
                                  ? "var(--color-paper-accent)"
                                  : isOccupied
                                    ? "var(--color-paper-line-2)"
                                    : isAnchorTier
                                      ? "var(--color-paper-ink)"
                                      : "var(--color-paper-ink-2)",
                              background: isPicked
                                ? "var(--color-paper-accent-soft)"
                                : isOccupied
                                  ? "color-mix(in srgb, var(--color-paper-3) 92%, transparent)"
                                  : "color-mix(in srgb, var(--color-paper) 90%, transparent)",
                            }}
                            className={cn(
                              "group flex flex-col items-center justify-center gap-0.5",
                              "rounded-[3px] p-1 text-center leading-tight",
                              "transition-[transform,background-color,border-color] duration-200 ease-smooth",
                              "animate-[pop-in_0.4s_var(--ease-out-soft)_both]",
                              // העוגן נושא מסגרת מלאה ועבה יותר גם
                              // כשהוא פנוי — ההיררכיה בין הדרגות
                              // נקראת עוד לפני שקוראים מילה.
                              isOccupied
                                ? "cursor-not-allowed border border-solid"
                                : isPicked
                                  ? "cursor-pointer border-2"
                                  : isEligible
                                    ? "cursor-pointer border-2 [animation:card-pulse_1.8s_ease-in-out_infinite] hover:scale-[1.03]"
                                    : isAnchorTier
                                      ? "cursor-pointer border-2 border-solid hover:scale-[1.03]"
                                      : "cursor-pointer border border-dashed hover:scale-[1.03] hover:border-solid",
                            )}
                          >
                            {isPicked ? (
                              <>
                                <ConfettiBurst />
                                <span
                                  className="absolute right-1 top-1 grid size-4 place-items-center rounded-full text-white"
                                  style={{
                                    background: "var(--color-paper-accent)",
                                  }}
                                >
                                  <Check className="size-2.5" strokeWidth={3} />
                                </span>
                              </>
                            ) : null}

                            {/* תווית הדרגה — מילה מפורשת, לא רק רמז
                                עיצובי. הקהל לא-טכני ולא אמור לפענח
                                עובי מסגרת. */}
                            <HotspotTierTag tier={spot.tier} muted={isOccupied} />

                            {soldTo ? (
                              /* נמכר ושולם — הלוח מתמלא לעיני הבאים */
                              <>
                                <span
                                  className="text-[8.5px] uppercase tracking-[0.12em]"
                                  style={{ color: "var(--color-paper-muted)" }}
                                >
                                  כאן מפרסם
                                </span>
                                <span
                                  className="line-clamp-2 text-[11.5px] font-bold"
                                  style={{ color: "var(--color-paper-ink)" }}
                                >
                                  {soldTo}
                                </span>
                              </>
                            ) : isOccupied ? (
                              <span
                                className="text-[11px] font-semibold"
                                style={{ color: "var(--color-paper-muted)" }}
                              >
                                תפוס
                              </span>
                            ) : (
                              <>
                                <span
                                  className="text-[8.5px]"
                                  style={{ color: "var(--color-paper-muted)" }}
                                >
                                  מקום זה שמור ל
                                </span>
                                <span
                                  className={cn(
                                    "line-clamp-2 font-semibold",
                                    isAnchorTier ? "text-[12.5px]" : "text-[11px]",
                                  )}
                                  style={{ color: "var(--color-paper-ink-2)" }}
                                >
                                  {spot.category}
                                </span>
                                <span
                                  className={cn(
                                    "tnum font-bold leading-none",
                                    isAnchorTier ? "text-[12.5px]" : "text-[11px]",
                                  )}
                                  style={{ color: "var(--color-paper-accent)" }}
                                >
                                  {formatPrice(slot.priceAgorot)}
                                </span>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </figure>
                ))}
              </div>

              {/* --- קו הקיפול --- */}
              <div className="relative my-2.5 shrink-0">
                <div className="border-t border-dashed" style={{ borderColor: "var(--color-paper-line-2)" }} />
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-[8.5px] uppercase tracking-[0.14em]"
                  style={{ background: "var(--color-paper)", color: "var(--color-paper-muted)" }}
                >
                  קו קיפול
                </span>
              </div>

              {/* ====== חצי תחתון: A5 — לוח השנה ====== */}
              <MonthSheet calendar={displayCalendar} />
              </div>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-10 lg:hidden"
            style={{
              background:
                "linear-gradient(to left, var(--color-canvas), transparent)",
            }}
          />
        </div>
      </div>
  );
}

/* --------------------------------------------------------------- */

function countTier(image: BoardImage, tier: PresenceTier): number {
  return image.hotspots.filter((h) => h.tier === tier).length;
}

/**
 * מצב המלאי של דרגה אחת, בניסוח מלא ולא במספר יבש — "עוגן · נתפס"
 * מול "משלים · 3 מקומות פנויים". הקהל לא-טכני, והסטטוס חייב
 * להיקרא בטקסט מפורש ולא רק בקוד צבע.
 */
function TierStatusBadge({
  tier,
  availability,
}: {
  tier: PresenceTier;
  availability: TierAvailability | undefined;
}) {
  // דרגה שאין לה בכלל מקומות בסצנה של החודש לא מוזכרת — עדיף
  // כלום מאשר "עוגן · נתפס" על משהו שמעולם לא הוצע.
  if (!availability || availability.capacity === 0) return null;

  const { remaining, capacity } = availability;
  // דחיפות רק כשבאמת נגסו במלאי. לעוגן יש שני מקומות בסך הכול,
  // ולכן "2 פנויים" הוא מלאי *מלא* — צביעתו באזהרה הייתה דחיפות
  // מזויפת על דרגה שאיש עוד לא נגע בה.
  const tone =
    remaining === 0
      ? "neutral"
      : remaining < capacity && remaining <= 2
        ? "warn"
        : "success";

  return (
    <Badge tone={tone}>
      <span className="font-bold">{TIER_LABELS[tier]}</span>
      <span>
        {remaining === 0
          ? "· נתפס"
          : remaining === 1
            ? "· מקום אחד פנוי"
            : `· ${remaining} מקומות פנויים`}
      </span>
    </Badge>
  );
}

/** תג הדרגה בתוך החלון עצמו, בצבעי הנייר */
function HotspotTierTag({
  tier,
  muted,
}: {
  tier: PresenceTier;
  muted?: boolean;
}) {
  const isAnchor = tier === "ANCHOR";

  return (
    <span
      className="px-1 text-[8px] font-bold uppercase leading-[1.5] tracking-[0.1em]"
      style={
        muted
          ? { color: "var(--color-paper-muted)" }
          : isAnchor
            ? {
                background: "var(--color-paper-ink)",
                color: "var(--color-paper)",
              }
            : { color: "var(--color-paper-muted)" }
      }
    >
      {TIER_LABELS[tier]}
    </span>
  );
}

const CONFETTI_COLORS = [
  "var(--color-brand-orange)",
  "var(--color-brand-pink)",
  "var(--color-brand-purple)",
  "var(--color-paper-accent)",
];

/**
 * פיצוץ קונפטי זעיר סביב תג הבחירה כשמקום נבחר — בקשת לקוחה
 * מפורשת: "לשבור את החזרתיות" ברגע הבחירה. גרסה מוקטנת בהשראת
 * אפקט כפתור מוכר (ספינר→וי→קונפטי) — כאן רק חלק הקונפטי, בקנה
 * מידה שמתאים לחלון קטן, לא כפתור ענק. ממופה פעם אחת ב-mount
 * בלבד, כי isPicked הופך מ-false ל-true פעם אחת בלבד להזמנה.
 */
function ConfettiBurst() {
  const particles = React.useMemo(
    () =>
      Array.from({ length: 10 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 14 + Math.random() * 16;
        return {
          dx: Math.round(Math.cos(angle) * distance),
          dy: Math.round(Math.sin(angle) * distance),
          delay: Math.round(Math.random() * 80),
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        };
      }),
    [],
  );

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-[11px] top-[11px] size-0"
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute size-[3.5px] rounded-full"
          style={{
            background: p.color,
            animation: `confetti-pop 0.55s ${p.delay}ms ease-out forwards`,
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
          }}
        />
      ))}
    </span>
  );
}

function FocusPanel({
  slot,
  category,
  soldTo,
  isPicked,
  isOccupied,
  isEligible,
  isWrongType,
  onSelect,
}: {
  slot: MockupSlot;
  category: string;
  /** שם העסק שקנה ושילם על המקום הזה במהדורה הנצפית, אם יש */
  soldTo: string | null;
  isPicked: boolean;
  isOccupied: boolean;
  isEligible: boolean;
  isWrongType: boolean;
  onSelect: () => void;
}) {
  // תצוגת "ל-3 חודשים" היא הצצה כללית לפני שנבחרה דרגת חבילה —
  // ברגע שיש חבילה בתהליך (נבחר/מתאים/סוג אחר) הכפתור וההקשר כבר
  // מספרים את הסיפור המדויק, ולא צריך עוד הצצה כללית שעלולה לבלבל.
  const midPackage = isPicked || isEligible || isWrongType;
  const disabled = isOccupied || isWrongType;

  return (
    <div>
      <span
        className={cn(
          "inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
          slot.tier === "ANCHOR"
            ? "bg-ink text-canvas"
            : "border border-line text-muted",
        )}
      >
        {TIER_LABELS[slot.tier]}
      </span>

      <p className="mt-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
        {soldTo ? "המקום נמכר" : "מקום זה שמור ל"}
      </p>

      <h3 className="mt-1 font-display text-2xl leading-tight text-ink">
        {soldTo ?? category}
      </h3>

      <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
        {soldTo
          ? `המקום הזה כבר נתפס על ידי ${category} במהדורה הזו. אפשר לדפדף לחודש אחר, או לבחור מקום אחר בסצנה.`
          : TIER_DESCRIPTIONS[slot.tier]}
      </p>

      <dl className="mt-4 space-y-2.5 border-y border-line py-4 text-[13px]">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">מידות בדפוס</dt>
          <dd className="tnum font-semibold text-ink">
            {formatCm(slot.widthCm, slot.heightCm)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">מק״ט</dt>
          <dd className="tnum font-semibold text-ink">{slot.sku}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="text-[11.5px] text-muted">מחיר למהדורה (חודש בודד)</p>
        <p className="tnum font-display text-3xl leading-tight text-accent">
          {formatPrice(slot.priceAgorot)}
        </p>
      </div>

      {midPackage ? null : (
        <div className="mt-2.5 flex items-center justify-between rounded-md bg-surface-2 px-3 py-2">
          <span className="text-[11.5px] text-ink-2">ל-3 חודשים</span>
          <span className="tnum text-[13px] font-bold text-ink">
            {formatPrice(
              packageTotalAgorotForEditions(slot.priceAgorot, 3, slot.tier),
            )}
          </span>
        </div>
      )}

      {slot.description ? (
        <p className="mt-3.5 text-[12px] leading-relaxed text-muted">
          {slot.description}
        </p>
      ) : null}

      <button
        type="button"
        onClick={disabled ? undefined : onSelect}
        disabled={disabled}
        className={cn(
          "mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold",
          "transition-colors duration-200 ease-smooth",
          disabled
            ? "cursor-not-allowed bg-surface-3 text-muted"
            : isPicked
              ? "bg-accent-soft text-accent-strong"
              : "bg-ink text-canvas hover:bg-accent hover:text-white",
        )}
      >
        {isOccupied ? (
          "תפוס במהדורה זו"
        ) : isWrongType ? (
          "דרגה או גודל אחר — לא מתאים לחבילה"
        ) : isPicked ? (
          <>
            <Check className="size-4" strokeWidth={3} />
            הסרה מהחודש הזה
          </>
        ) : isEligible ? (
          "הוספה לחבילה"
        ) : (
          <>
            להזמנה
            <ArrowLeft className="size-4" />
          </>
        )}
      </button>
    </div>
  );
}

"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check, MousePointerClick, Sparkles } from "lucide-react";
import { cn, formatCm, formatPrice } from "@/lib/utils";
import { packageTotalAgorotForEditions } from "@/lib/packages";
import type { SiteContentData } from "@/lib/content";
import type { EditionAvailability } from "@/lib/availability";
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
};

export type { BoardHotspot, BoardImage };

/** "אותו סוג" = אותו גודל פיזי — קובע אילו משבצות מתאימות זו לזו לחבילה */
export function isSameType(a: MockupSlot, b: MockupSlot): boolean {
  return (
    a.colSpan === b.colSpan &&
    a.rowSpan === b.rowSpan &&
    a.widthCm === b.widthCm &&
    a.heightCm === b.heightCm
  );
}

type Props = {
  /** תמונות ההשראה והחלונות שעליהן — תבנית גלובלית, זהה לכל עיר/מהדורה */
  board: BoardImage[];
  calendar: SiteContentData["calendar"];
  /** מהדורות פתוחות של העיר שנבחרה — מניעות את הדפדוף בין החודשים */
  editions: EditionAvailability[];
  viewedEditionId: string | null;
  onViewedEditionChange: (id: string) => void;
  /** המשבצת שקבעה את "הסוג" הנרכש בהזמנה הזו — null לפני הבחירה הראשונה */
  anchorSlot: MockupSlot | null;
  /** כמה חודשים בסך הכול צריך לבחור (דרגת החבילה) — null עד שנבחרה */
  targetCount: number | null;
  /** הבחירה בפועל לכל מהדורה: editionId -> המשבצת שנבחרה בה */
  selections: Record<string, MockupSlot>;
  onSelect: (slot: MockupSlot) => void;
};

/* ---------------------------------------------------------------
   שטח המכירה הוא תמונות השראה, לא רשת ריבועים.

   כל תמונה נושאת "חלונות" (Hotspot) במיקומים מדויקים בתוכה,
   והמיקום נשמר באחוזים — לכן החלון נשאר מוצמד לאותה נקודה בתמונה
   בכל רוחב מסך, בלי חישובי פיקסלים.

   חלון פנוי אומר למי הוא שמור ("מקום זה שמור לחנות תינוקות") ומה
   מחירו. חלון שנמכר ושולם מציג את שם העסק שקנה אותו — כך הלוח
   "מתמלא" לעיני המפרסמים הבאים. בקשה מפורשת של הלקוחה.

   הזמינות נמדדת ברמת (מהדורה, משבצת): אותו חלון יכול להיות תפוס
   בחודש אחד ופנוי בחודש אחר של אותה עיר, ולכן המצב תלוי בחודש
   שמוצג כרגע (viewedEditionId) ואינו קבוע.
   --------------------------------------------------------------- */

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

  const allHotspots = React.useMemo(
    () => board.flatMap((image) => image.hotspots),
    [board],
  );

  const viewedIndex = editions.findIndex((e) => e.id === viewedEditionId);
  const viewedEdition = viewedIndex >= 0 ? editions[viewedIndex] : null;
  const occupiedSet = React.useMemo(
    () => new Set(viewedEdition?.occupiedSlotIds ?? []),
    [viewedEdition],
  );
  const soldBySlotId = viewedEdition?.soldBySlotId ?? {};
  // המשבצת שכבר נבחרה עבור החודש שמוצג כרגע (אם בכלל)
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
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
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

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-[15px] font-bold text-ink">
                {viewedEdition?.hebrewLabel ?? "—"}
              </span>
              {viewedEdition ? (
                <Badge tone={viewedEdition.remaining <= 3 ? "warn" : "success"}>
                  {viewedEdition.remaining} פנויות מתוך {viewedEdition.capacity}
                </Badge>
              ) : null}
            </div>
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
          תתיישר איתו בלי להיות בתוך אזור הגלילה האופקית — בתוכו
          כל מה שחורג מהדף נחתך (overflow-x-auto), וזה בדיוק מה
          שקטע את הקו של החלונית כשהיא ישבה בפנים. */}
      <div className="relative mx-auto w-full max-w-[620px]">
        {/* ============ חלון צף — הסכום והמעבר להזמנה ============
            top-0 מיישר אותו בול לגובה החלק העליון של הדף
            ("מקביל ללוח"), וה-end בערך calc דוחף אותו כולו החוצה,
            צמוד לשוליים החיצוניים — לא מכסה אף משבצת. */}
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
              "border border-line-2 bg-surface p-5",
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
            {/* --- גיליון הלוח — נייר אמיתי, קבוע לבן ללא קשר לערכת הנושא ---
                אין יותר יחס A4 קבוע: הגובה נקבע מתמונות ההשראה עצמן,
                שיחס הגובה-רוחב שלהן משתנה. --- */}
            <div
              className={cn(
                "paper relative mx-auto flex w-full max-w-[620px] flex-col",
                "rounded-lg border border-[--color-paper-line] p-3 shadow-e3 sm:p-4",
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
              {/* ====== אזור המפרסמים — תמונות ההשראה והחלונות ====== */}
              <div className="flex flex-col gap-3">
                {board.length === 0 ? (
                  <div
                    className="rounded-[4px] border border-dashed p-8 text-center text-[12px]"
                    style={{
                      borderColor: "var(--color-paper-line-2)",
                      color: "var(--color-paper-muted)",
                    }}
                  >
                    עדיין לא הוגדרו תמונות השראה ללוח.
                  </div>
                ) : null}

                {board.map((image, imageIndex) => (
                  <figure key={image.id} className="m-0">
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <figcaption
                        className="text-[10px] uppercase tracking-[0.16em]"
                        style={{ color: "var(--color-paper-muted)" }}
                      >
                        {image.label}
                      </figcaption>
                      <span
                        className="tnum text-[10px]"
                        style={{ color: "var(--color-paper-muted)" }}
                      >
                        {image.hotspots.length} מקומות
                      </span>
                    </div>

                    {/* יחס הגובה-רוחב שמור מראש כדי שהחלונות לא יזוזו
                        בזמן טעינת התמונה */}
                    <div
                      className="relative w-full overflow-hidden rounded-[4px] border"
                      style={{
                        aspectRatio: `${image.aspectRatio}`,
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
                        // "מתאים" = אותו גודל דפוס כמו העוגן, פנוי, ולא
                        // כבר הבחירה של החודש הזה — ההדגשה לפי סוג
                        const isEligible =
                          !!anchorSlot &&
                          !!targetCount &&
                          !isOccupied &&
                          !isPicked &&
                          isSameType(anchorSlot, slot);

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
                                ? `${spot.category} — נמכר ל${soldTo}`
                                : isOccupied
                                  ? `${spot.category} — תפוס במהדורה זו`
                                  : `מקום זה שמור ל${spot.category}, ${formatPrice(slot.priceAgorot)} — לחצו להזמנה`
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
                                    : "var(--color-paper-ink-2)",
                              background: isPicked
                                ? "var(--color-paper-accent-soft)"
                                : isOccupied
                                  ? "color-mix(in srgb, var(--color-paper-3) 92%, transparent)"
                                  : "color-mix(in srgb, var(--color-paper) 88%, transparent)",
                            }}
                            className={cn(
                              "group flex flex-col items-center justify-center gap-0.5",
                              "rounded-[3px] border p-1 text-center leading-tight",
                              "transition-[transform,background-color,border-color] duration-200 ease-smooth",
                              "animate-[pop-in_0.4s_var(--ease-out-soft)_both]",
                              isOccupied
                                ? "cursor-not-allowed border-solid"
                                : isPicked
                                  ? "cursor-pointer border-2"
                                  : isEligible
                                    ? "cursor-pointer border-2 [animation:card-pulse_1.8s_ease-in-out_infinite] hover:scale-[1.03]"
                                    : "cursor-pointer border-dashed hover:scale-[1.03] hover:border-solid",
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

                            {soldTo ? (
                              /* נמכר ושולם — הלוח מתמלא לעיני הבאים */
                              <>
                                <span
                                  className="text-[8px] uppercase tracking-[0.12em]"
                                  style={{ color: "var(--color-paper-muted)" }}
                                >
                                  כאן מפרסם
                                </span>
                                <span
                                  className="line-clamp-2 text-[10.5px] font-bold"
                                  style={{ color: "var(--color-paper-ink)" }}
                                >
                                  {soldTo}
                                </span>
                              </>
                            ) : isOccupied ? (
                              <span
                                className="text-[10px] font-semibold"
                                style={{ color: "var(--color-paper-muted)" }}
                              >
                                תפוס
                              </span>
                            ) : (
                              <>
                                <span
                                  className="text-[8px]"
                                  style={{ color: "var(--color-paper-muted)" }}
                                >
                                  מקום זה שמור ל
                                </span>
                                <span
                                  className="line-clamp-2 text-[10px] font-semibold"
                                  style={{ color: "var(--color-paper-ink-2)" }}
                                >
                                  {spot.category}
                                </span>
                                <span
                                  className="tnum text-[10px] font-bold leading-none"
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

const CONFETTI_COLORS = [
  "var(--color-brand-orange)",
  "var(--color-brand-pink)",
  "var(--color-brand-purple)",
  "var(--color-paper-accent)",
];

/**
 * פיצוץ קונפטי זעיר סביב תג הבחירה כשמשבצת נבחרת — בקשת לקוחה
 * מפורשת: "לשבור את החזרתיות" של 14 ריבועים זהים ברגע הבחירה.
 * גרסה מוקטנת בהשראת אפקט כפתור מוכר (ספינר→וי→קונפטי) — כאן רק
 * חלק הקונפטי, בקנה מידה שמתאים לריבוע קטן, לא כפתור ענק.
 * ממופה פעם אחת ב-mount בלבד (לא נטען מחדש כל עוד המשבצת נשארת
 * נבחרת) כי isSelected הופך מ-false ל-true פעם אחת בלבד להזמנה.
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
  /** שם העסק שקנה ושילם על החלון הזה במהדורה הנצפית, אם יש */
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
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
        {soldTo ? "המקום נמכר" : "מקום זה שמור ל"}
      </span>

      <h3 className="mt-2 font-display text-2xl leading-tight text-ink">
        {soldTo ?? category}
      </h3>

      {soldTo ? (
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
          המקום הזה כבר נתפס על ידי {category} במהדורה הזו. אפשר לדפדף
          לחודש אחר, או לבחור מקום אחר בלוח.
        </p>
      ) : null}

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
          <span className="text-[11.5px] text-ink-2">ל-3 חודשים · 5% הנחה</span>
          <span className="tnum text-[13px] font-bold text-ink">
            {formatPrice(packageTotalAgorotForEditions(slot.priceAgorot, 3))}
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
          "סוג אחר — לא מתאים לחבילה"
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

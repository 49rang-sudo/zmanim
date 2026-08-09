"use client";

import * as React from "react";
import { ArrowLeft, Check, MoveHorizontal } from "lucide-react";
import { cn, formatCm, formatPrice } from "@/lib/utils";
import type { SiteContentData } from "@/lib/content";
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

type Props = {
  slots: MockupSlot[];
  calendar: SiteContentData["calendar"];
  selectedSlotId?: string | null;
  onSelect: (slot: MockupSlot) => void;
};

/* ---------------------------------------------------------------
   הגיליון הוא A4 מקופל: 210×297 מ"מ.
   החצי העליון הוא A5 (210×148.5) ומוקצה למפרסמים, החצי התחתון
   הוא לוח השנה.

   הריבועים כאן הם בחירת גודל ומחיר בלבד. אין להם סטטוס מלאי,
   כי העימוד הסופי ממזג ומזיז אותם — הזמינות נמדדת ברמת העיר.
   --------------------------------------------------------------- */

export function CalendarMockup({
  slots,
  calendar,
  selectedSlotId,
  onSelect,
}: Props) {
  const [hovered, setHovered] = React.useState<string | null>(null);

  const selected = slots.find((s) => s.id === selectedSlotId) ?? null;
  const focused = slots.find((s) => s.id === hovered) ?? selected;

  return (
    <div>
      <div className="relative">
        <p className="mb-2 flex items-center gap-1.5 text-[12px] text-muted lg:hidden">
          <MoveHorizontal className="size-3.5 shrink-0" />
          גללו לצדדים כדי לראות את כל העמוד
        </p>

        {/* ============ חלון צף — הסכום והמעבר להזמנה ============
            צף בפינת המוקאפ עצמו (לא בתחתית המסך) — קרוב לאזור
            שבו בפועל עומדים/לוחצים, ולא מכסה את לוח השנה למטה. */}
        <div
          aria-hidden={!focused}
          className={cn(
            "pointer-events-none absolute -top-3 end-0 z-40 w-full max-w-[280px] sm:end-4",
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
            {focused ? (
              <FocusPanel
                slot={focused}
                isSelected={selectedSlotId === focused.id}
                onSelect={() => onSelect(focused)}
              />
            ) : null}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-x-auto pb-2">
            {/* --- גיליון A4 — נייר אמיתי, קבוע לבן ללא קשר לערכת הנושא --- */}
            <div
              className={cn(
                "paper relative mx-auto flex min-w-[520px] max-w-[620px] flex-col",
                "aspect-[210/297] rounded-lg border border-[--color-paper-line] p-3 shadow-e3 sm:p-4",
              )}
              onMouseLeave={() => setHovered(null)}
            >
              {/* ====== חצי עליון: A5 — אזור המפרסמים ====== */}
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="mb-2 flex shrink-0 items-baseline justify-between">
                  <p
                    className="text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: "var(--color-paper-muted)" }}
                  >
                    אזור המפרסמים · A5
                  </p>
                  <p
                    className="tnum text-[10px]"
                    style={{ color: "var(--color-paper-muted)" }}
                  >
                    21 × 14.85 ס״מ
                  </p>
                </div>

                <div
                  className="grid min-h-0 flex-1 gap-1.5"
                  style={{
                    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                    gridTemplateRows: "repeat(4, minmax(0, 1fr))",
                  }}
                >
                  {slots.map((slot, index) => {
                    const isSelected = selectedSlotId === slot.id;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => onSelect(slot)}
                        onMouseEnter={() => setHovered(slot.id)}
                        onFocus={() => setHovered(slot.id)}
                        onBlur={() => setHovered(null)}
                        aria-label={`${slot.name}, ${formatCm(slot.widthCm, slot.heightCm)}, ${formatPrice(slot.priceAgorot)} — לחצו להזמנה`}
                        style={{
                          gridColumn: `${slot.col} / span ${slot.colSpan}`,
                          gridRow: `${slot.row} / span ${slot.rowSpan}`,
                          animationDelay: `${index * 35}ms`,
                          borderColor: isSelected
                            ? "var(--color-paper-accent)"
                            : "var(--color-paper-line-2)",
                          background: isSelected
                            ? "var(--color-paper-accent-soft)"
                            : "var(--color-paper-2)",
                        }}
                        className={cn(
                          "group relative flex cursor-pointer flex-col items-center justify-center gap-0.5",
                          "overflow-hidden rounded-[4px] border p-1 text-center",
                          "transition-[transform,background-color,border-color,box-shadow] duration-200 ease-smooth",
                          "animate-[pop-in_0.4s_var(--ease-out-soft)_both]",
                          isSelected ? "border-2 shadow-e2" : "border-dashed hover:-translate-y-0.5 hover:shadow-e2",
                        )}
                      >
                        {isSelected ? (
                          <span
                            className="absolute right-1 top-1 grid size-4 place-items-center rounded-full text-white"
                            style={{ background: "var(--color-paper-accent)" }}
                          >
                            <Check className="size-2.5" strokeWidth={3} />
                          </span>
                        ) : null}

                        <span
                          className="text-[9.5px] font-semibold leading-tight"
                          style={{ color: "var(--color-paper-ink-2)" }}
                        >
                          {slot.name}
                        </span>
                        <span
                          className="tnum text-[8.5px] leading-none"
                          style={{ color: "var(--color-paper-muted)" }}
                        >
                          {formatCm(slot.widthCm, slot.heightCm)}
                        </span>
                        {/* המחיר על הריבוע עצמו — בלי צורך לרחף */}
                        <span
                          className="tnum text-[10px] font-bold leading-none"
                          style={{ color: "var(--color-paper-accent)" }}
                        >
                          {formatPrice(slot.priceAgorot)}
                        </span>
                      </button>
                    );
                  })}
                </div>
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
              <MonthSheet calendar={calendar} />
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
    </div>
  );
}

/* --------------------------------------------------------------- */

function FocusPanel({
  slot,
  isSelected,
  onSelect,
}: {
  slot: MockupSlot;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div>
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
        גודל מודעה
      </span>

      <h3 className="mt-2 font-display text-2xl leading-tight text-ink">
        {slot.name}
      </h3>

      <dl className="mt-4 space-y-2.5 border-y border-line py-4 text-[13px]">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">מידות</dt>
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
        <p className="text-[11.5px] text-muted">מחיר לשנה</p>
        <p className="tnum font-display text-3xl leading-tight text-accent">
          {formatPrice(slot.priceAgorot)}
        </p>
      </div>

      {slot.description ? (
        <p className="mt-3.5 text-[12px] leading-relaxed text-muted">
          {slot.description}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold",
          "transition-colors duration-200 ease-smooth",
          isSelected
            ? "bg-accent-soft text-accent-strong"
            : "bg-ink text-canvas hover:bg-accent hover:text-white",
        )}
      >
        {isSelected ? (
          <>
            <Check className="size-4" strokeWidth={3} />
            נבחר
          </>
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

"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteContentData } from "@/lib/content";

/* ---------------------------------------------------------------
   לוח החודש — החלק התחתון של הגיליון המודפס. זה נייר, לא כרום
   האתר, ולכן כל הצבעים כאן הם --color-paper-* הקבועים ולא
   הטוקנים הכהים של האתר.

   התאריך העברי אמיתי ומגיע מ-Intl של הדפדפן. זמני הדלקת הנרות
   כאן הם *הדגמה ויזואלית בלבד* — בהפקה האמיתית חייבים להגיע
   מ"עתים לבינה", אסור להדפיס זמן שחושב בקירוב.
   --------------------------------------------------------------- */

const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const hebrewParts = new Intl.DateTimeFormat("he-u-ca-hebrew", {
  day: "numeric",
  month: "long",
});

const gregorianMonthName = new Intl.DateTimeFormat("he-IL", { month: "long" });

type DayCell = {
  date: Date;
  day: number;
  monthName: string;
  hebrewDay: number;
  hebrewMonth: string;
  inMonth: boolean;
  isToday: boolean;
  isShabbat: boolean;
  events: { label: string; time?: string; kind: "zman" | "hebrew" }[];
};

function hebrewDayNumber(date: Date): number {
  const parts = new Intl.DateTimeFormat("he-u-ca-hebrew", {
    day: "numeric",
  }).formatToParts(date);
  const raw = parts.find((p) => p.type === "day")?.value ?? "";
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits) return Number(digits);

  const values: Record<string, number> = {
    א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9,
    י: 10, כ: 20, ל: 30,
  };
  return [...raw].reduce((sum, ch) => sum + (values[ch] ?? 0), 0);
}

function hebrewMonthName(date: Date): string {
  const parts = hebrewParts.formatToParts(date);
  return parts.find((p) => p.type === "month")?.value ?? "";
}

/** זמן הדלקת נרות להדגמה — משתנה בהדרגה לאורך העונה */
function demoCandleTime(date: Date): string {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  const minutesFromNoon = 420 - Math.round(Math.sin((dayOfYear / 365) * Math.PI * 2) * 55);
  const hour = 12 + Math.floor(minutesFromNoon / 60);
  const minute = minutesFromNoon % 60;
  return `${hour}:${String(minute).padStart(2, "0")}`;
}

function buildCells(year: number, month: number): DayCell[] {
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(start.getDate() - first.getDay());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: DayCell[] = [];

  for (let i = 0; i < 35; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    const hebrewDay = hebrewDayNumber(date);
    const weekday = date.getDay();
    const events: DayCell["events"] = [];

    if (hebrewDay === 1) {
      events.push({ label: `ראש חודש ${hebrewMonthName(date)}`, kind: "hebrew" });
    } else if (hebrewDay === 29 || hebrewDay === 30) {
      events.push({ label: "ערב ראש חודש", kind: "hebrew" });
    }

    if (weekday === 5) {
      events.push({ label: "הדלקת נרות", time: demoCandleTime(date), kind: "zman" });
    }

    cells.push({
      date,
      day: date.getDate(),
      monthName: gregorianMonthName.format(date),
      hebrewDay,
      hebrewMonth: hebrewMonthName(date),
      inMonth: date.getMonth() === month - 1,
      isToday: date.getTime() === today.getTime(),
      isShabbat: weekday === 6,
      events,
    });
  }

  return cells;
}

export function MonthSheet({
  calendar,
}: {
  calendar: SiteContentData["calendar"];
}) {
  const cells = React.useMemo(
    () => buildCells(calendar.gregorianYear, calendar.gregorianMonth),
    [calendar.gregorianYear, calendar.gregorianMonth],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* --- כותרת הלוח --- */}
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <p className="font-display text-lg leading-none" style={{ color: "var(--color-paper-ink)" }}>
          {calendar.monthLabel}{" "}
          <span style={{ color: "var(--color-paper-muted)" }}>{calendar.yearLabel}</span>
        </p>

        {/* חסות הזמנים — יתרון אמינות מרכזי בקהל היעד */}
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-semibold leading-none"
          style={{ background: "var(--color-paper-accent-soft)", color: "var(--color-paper-accent)" }}
        >
          <Clock className="size-3" />
          {calendar.footnote}
        </span>
      </div>

      {/* --- שמות הימים --- */}
      <div className="mb-1 grid shrink-0 grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="pb-1 text-center text-[10px] font-semibold"
            style={{ color: "var(--color-paper-muted)" }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* --- רשת הימים --- */}
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-5 gap-1">
        {cells.map((cell, index) => (
          <div
            key={index}
            className="relative flex min-h-0 flex-col rounded-[5px] border p-1 text-right"
            style={{
              borderColor: cell.isToday
                ? "var(--color-paper-accent)"
                : cell.inMonth
                  ? "var(--color-paper-line)"
                  : "color-mix(in srgb, var(--color-paper-line) 60%, transparent)",
              background: cell.isToday
                ? "var(--color-paper-accent-soft)"
                : cell.inMonth
                  ? cell.isShabbat
                    ? "var(--color-paper-2)"
                    : "var(--color-paper)"
                  : "color-mix(in srgb, var(--color-paper-3) 50%, transparent)",
            }}
          >
            <div className="flex shrink-0 items-baseline justify-between gap-1">
              <span
                className="tnum font-display text-[13px] leading-none"
                style={{ color: cell.inMonth ? "var(--color-paper-ink)" : "var(--color-paper-muted)" }}
              >
                {cell.day}
              </span>

              {cell.isToday ? (
                <span
                  className="rounded-full px-1.5 py-px text-[7px] font-bold leading-tight text-white"
                  style={{ background: "var(--color-paper-accent)" }}
                >
                  היום
                </span>
              ) : null}
            </div>

            <span
              className="shrink-0 text-[7.5px] leading-tight"
              style={{
                color: cell.inMonth
                  ? "var(--color-paper-muted)"
                  : "color-mix(in srgb, var(--color-paper-muted) 60%, transparent)",
              }}
            >
              {cell.monthName}
            </span>

            {/* --- אירועים וזמנים --- */}
            <div className="mt-auto space-y-px overflow-hidden">
              {cell.events.map((event, i) => (
                <p
                  key={i}
                  className="flex items-center justify-end gap-0.5 text-[7px] leading-tight"
                  style={{ color: cell.inMonth ? "var(--color-paper-accent)" : "var(--color-paper-muted)" }}
                >
                  {event.time ? (
                    <>
                      <Clock className="size-2 shrink-0" />
                      <span className="tnum">{event.time}</span>
                    </>
                  ) : (
                    <span className="size-1 shrink-0 rounded-full bg-current" />
                  )}
                  <span className="truncate">{event.label}</span>
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

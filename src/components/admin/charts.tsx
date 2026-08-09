"use client";

import * as React from "react";
import { cn, formatPrice } from "@/lib/utils";

/** עברית מבחינה בין יחיד לרבים — "1 מכירות" נקרא כתקלה */
function salesLabel(count: number): string {
  return count === 1 ? "מכירה אחת" : `${count} מכירות`;
}

/* ===============================================================
   רכיבי תצוגת נתונים.
   מבנה אחיד: גוון אחד לנתונים, רשת וצירים רסיסיים, טקסט תמיד
   בטוקני דיו ולעולם לא בצבע הסדרה, ושכבת ריחוף בכל גרף.
   =============================================================== */

/* --------------------------------------------------------------
   אריח מדד — לא גרף עמודה של ערך אחד
   -------------------------------------------------------------- */

export function StatTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "accent";
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-e1">
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p
        className={cn(
          "tnum mt-2 font-display text-3xl font-bold leading-none",
          tone === "accent" ? "text-accent" : "text-ink",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-1.5 text-[12.5px] text-muted">{sub}</p> : null}
    </div>
  );
}

/* --------------------------------------------------------------
   מד תפוסה — יחס בודד מול תקרה. לא עוגה של שתי פרוסות.
   -------------------------------------------------------------- */

export function Meter({
  label,
  value,
  max,
  caption,
}: {
  label: string;
  value: number;
  max: number;
  caption?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-e1">
      <div className="flex items-baseline justify-between">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted">
          {label}
        </p>
        {/* dir=ltr הכרחי: בעברית השבר מתהפך ל-"max / value" ומטעה */}
        <p dir="ltr" className="tnum text-[13px] font-semibold text-ink">
          {value} / {max}
        </p>
      </div>

      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-3"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-smooth"
          style={{ width: `${pct}%` }}
        />
      </div>

      {caption ? (
        <p className="mt-2 text-[12.5px] text-muted">{caption}</p>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------
   מגמה לאורך זמן — סדרה אחת, ולכן בלי מקרא.
   הזמן זורם משמאל לימין כמקובל בגרפים, גם בעמוד RTL.
   -------------------------------------------------------------- */

type TrendPoint = { key: string; label: string; revenue: number; count: number };

export function TrendArea({
  points,
  title,
}: {
  points: TrendPoint[];
  title: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const [showTable, setShowTable] = React.useState(false);

  const W = 800;
  const H = 220;
  const PAD = { top: 16, right: 8, bottom: 26, left: 8 };

  const max = Math.max(1, ...points.map((p) => p.revenue));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i: number) =>
    PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const line = points.map((p, i) => `${x(i)},${y(p.revenue)}`).join(" ");
  const area =
    points.length > 0
      ? `M ${x(0)},${PAD.top + innerH} L ${line.split(" ").join(" L ")} L ${x(points.length - 1)},${PAD.top + innerH} Z`
      : "";

  const active = hover !== null ? points[hover] : null;
  const empty = points.every((p) => p.revenue === 0);

  return (
    <figure className="rounded-lg border border-line bg-surface p-5 shadow-e1">
      <figcaption className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="text-[12px] font-semibold text-accent hover:underline"
        >
          {showTable ? "תצוגת גרף" : "תצוגת טבלה"}
        </button>
      </figcaption>

      {showTable ? (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-right text-[13px]">
            <thead className="sticky top-0 bg-surface text-[11.5px] uppercase text-muted">
              <tr>
                <th className="py-2 font-semibold">תקופה</th>
                <th className="py-2 font-semibold">מכירות</th>
                <th className="py-2 font-semibold">הכנסה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {points.map((p) => (
                <tr key={p.key}>
                  <td className="py-1.5 text-ink-2">{p.label}</td>
                  <td className="tnum py-1.5 text-ink">{p.count}</td>
                  <td className="tnum py-1.5 text-ink">
                    {formatPrice(p.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative" dir="ltr">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full overflow-visible"
            role="img"
            aria-label={`${title} — ${points.length} נקודות`}
            onMouseLeave={() => setHover(null)}
          >
            {/* רשת רסיסית: שלושה קווים, לא עשרה */}
            {[0, 0.5, 1].map((t) => (
              <line
                key={t}
                x1={PAD.left}
                x2={W - PAD.right}
                y1={PAD.top + innerH * t}
                y2={PAD.top + innerH * t}
                stroke="var(--color-line)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {!empty ? (
              <>
                <path
                  d={area}
                  fill="var(--color-accent)"
                  opacity={0.1}
                />
                <polyline
                  points={line}
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            ) : null}

            {/* אזורי פגיעה רחבים מהסימון עצמו */}
            {points.map((p, i) => (
              <rect
                key={p.key}
                x={x(i) - innerW / Math.max(1, points.length) / 2}
                y={PAD.top}
                width={innerW / Math.max(1, points.length)}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
            ))}

            {active ? (
              <>
                <line
                  x1={x(hover!)}
                  x2={x(hover!)}
                  y1={PAD.top}
                  y2={PAD.top + innerH}
                  stroke="var(--color-line-2)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                {/* טבעת משטח 2px כדי שהסמן ייקרא מעל השטח */}
                <circle
                  cx={x(hover!)}
                  cy={y(active.revenue)}
                  r={5}
                  fill="var(--color-accent)"
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              </>
            ) : null}

            {/* תוויות ציר נבחרות בלבד — לא אחת לכל נקודה */}
            {points.map((p, i) => {
              const step = Math.ceil(points.length / 6);
              if (i % step !== 0 && i !== points.length - 1) return null;
              return (
                <text
                  key={p.key}
                  x={x(i)}
                  y={H - 8}
                  textAnchor="middle"
                  className="fill-[var(--color-muted)] text-[11px]"
                >
                  {p.label}
                </text>
              );
            })}
          </svg>

          {active ? (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-line bg-surface px-3 py-2 shadow-e2"
              style={{ left: `${(x(hover!) / W) * 100}%`, top: `${(y(active.revenue) / H) * 100}%` }}
              dir="rtl"
            >
              <p className="text-[11.5px] text-muted">{active.label}</p>
              <p className="tnum text-[13.5px] font-bold text-ink">
                {formatPrice(active.revenue)}
              </p>
              <p className="tnum text-[11.5px] text-ink-2">
                {salesLabel(active.count)}
              </p>
            </div>
          ) : null}

          {empty ? (
            <p className="absolute inset-0 grid place-items-center text-[13px] text-muted">
              אין מכירות בטווח הזה
            </p>
          ) : null}
        </div>
      )}
    </figure>
  );
}

/* --------------------------------------------------------------
   דירוג ערים — עמודות אופקיות.
   הגודל מקודד באורך, ולכן כל העמודות באותו גוון: צבע כאן
   לא נושא מידע, ורק היה מוסיף רעש.
   -------------------------------------------------------------- */

export function RankedBars({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: { name: string; revenue: number; count: number; capacity?: number }[];
  emptyText: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  const withSales = rows.filter((r) => r.revenue > 0);
  const total = rows.reduce((sum, r) => sum + r.revenue, 0);

  return (
    <figure className="rounded-lg border border-line bg-surface p-5 shadow-e1">
      <figcaption className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        {total > 0 ? (
          <span className="tnum text-[12.5px] text-muted">
            סה״כ {formatPrice(total)}
          </span>
        ) : null}
      </figcaption>

      {withSales.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-muted">{emptyText}</p>
      ) : (
        <ul className="space-y-2.5">
          {withSales.map((row) => {
            const pct = (row.revenue / max) * 100;
            const share = total > 0 ? (row.revenue / total) * 100 : 0;

            return (
              <li key={row.name} className="group">
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-medium text-ink">
                    {row.name}
                  </span>
                  <span className="tnum text-[12.5px] text-ink-2">
                    {formatPrice(row.revenue)}
                    <span className="mr-2 text-muted">
                      {salesLabel(row.count)} · {share.toFixed(0)}%
                    </span>
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-accent transition-[width,opacity] duration-500 ease-smooth group-hover:opacity-80"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </figure>
  );
}

"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn, formatPrice } from "@/lib/utils";
import { Meter, RankedBars, StatTile, TrendArea } from "./charts";

type Stats = {
  range: string;
  bucket: "day" | "week" | "month";
  kpis: {
    revenue: number;
    orderCount: number;
    avgOrder: number;
    openOrders: number;
    occupied: number;
    totalCapacity: number;
    occupancyPct: number;
    lifetimeRevenue: number;
    lifetimeOrders: number;
  };
  overTime: { key: string; revenue: number; count: number }[];
  byCity: { name: string; revenue: number; count: number; capacity: number }[];
  topSlots: { sku: string; name: string; revenue: number; count: number }[];
};

const RANGES = [
  { value: "7d", label: "7 ימים" },
  { value: "30d", label: "30 יום" },
  { value: "90d", label: "רבעון" },
  { value: "12m", label: "שנה" },
  { value: "all", label: "הכל" },
];

/** תווית דלי בעברית — יום/שבוע מציגים תאריך, חודש מציג שם חודש */
function bucketLabel(key: string, bucket: Stats["bucket"]): string {
  if (bucket === "month") {
    const [year, month] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("he-IL", {
      month: "short",
      year: "2-digit",
    }).format(new Date(year, month - 1, 1));
  }

  const date = new Date(key);
  const formatted = new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "numeric",
  }).format(date);

  return bucket === "week" ? `שבוע ${formatted}` : formatted;
}

export function OverviewTab() {
  const [range, setRange] = React.useState("30d");
  const [stats, setStats] = React.useState<Stats | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setStats(null);

    fetch(`/api/admin/stats?range=${range}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error.message);
        setStats(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message ?? "טעינת הנתונים נכשלה");
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const points =
    stats?.overTime.map((p) => ({
      ...p,
      label: bucketLabel(p.key, stats.bucket),
    })) ?? [];

  return (
    <div>
      {/* --- מסנן טווח: שורה אחת מעל הגרפים --- */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="ml-1 text-[12.5px] font-medium text-muted">
          טווח זמן
        </span>
        {RANGES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setRange(option.value)}
            aria-pressed={range === option.value}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] font-semibold",
              "transition-colors duration-200 ease-smooth",
              range === option.value
                ? "bg-accent text-accent-ink"
                : "border border-line bg-surface text-ink-2 hover:border-accent",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {!stats ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28" />
            ))}
          </div>
          <div className="skeleton h-64" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="skeleton h-72" />
            <div className="skeleton h-72" />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* --- שורת מדדים --- */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="הכנסה בטווח"
              value={formatPrice(stats.kpis.revenue)}
              sub={`${stats.kpis.orderCount} מכירות`}
              tone="accent"
            />
            <StatTile
              label="עסקה ממוצעת"
              value={
                stats.kpis.avgOrder > 0 ? formatPrice(stats.kpis.avgOrder) : "—"
              }
              sub="ממוצע לכל מכירה בטווח"
            />
            <StatTile
              label="הזמנות פתוחות"
              value={String(stats.kpis.openOrders)}
              sub="ממתינות לקובץ או לתשלום"
            />
            <StatTile
              label="הכנסה מצטברת"
              value={formatPrice(stats.kpis.lifetimeRevenue)}
              sub={`${stats.kpis.lifetimeOrders} מכירות מאז ההשקה`}
            />
          </div>

          {/* --- מגמה --- */}
          <TrendArea points={points} title="מכירות לאורך זמן" />

          {/* --- ערים + תפוסה --- */}
          <div className="grid gap-4 lg:grid-cols-2">
            <RankedBars
              title="מכירות לפי עיר"
              rows={stats.byCity}
              emptyText="אין מכירות בטווח הזה"
            />

            <div className="space-y-4">
              <Meter
                label="תפוסת המהדורה"
                value={stats.kpis.occupied}
                max={stats.kpis.totalCapacity}
                caption={`${stats.kpis.occupancyPct}% מהמשבצות בכל הערים הפעילות נתפסו`}
              />

              <figure className="rounded-lg border border-line bg-surface p-5 shadow-e1">
                <figcaption className="mb-3">
                  <h3 className="font-display text-lg font-semibold text-ink">
                    משבצות מובילות
                  </h3>
                </figcaption>

                {stats.topSlots.length === 0 ? (
                  <p className="py-6 text-center text-[13px] text-muted">
                    אין מכירות בטווח הזה
                  </p>
                ) : (
                  <table className="w-full text-right text-[13px]">
                    <thead className="text-[11.5px] uppercase tracking-wide text-muted">
                      <tr>
                        <th className="pb-2 font-semibold">משבצת</th>
                        <th className="pb-2 font-semibold">מכירות</th>
                        <th className="pb-2 font-semibold">הכנסה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {stats.topSlots.map((slot) => (
                        <tr key={slot.sku}>
                          <td className="py-2">
                            <span className="text-ink">{slot.name}</span>
                            <span className="tnum mr-2 text-[11.5px] text-muted">
                              {slot.sku}
                            </span>
                          </td>
                          <td className="tnum py-2 text-ink-2">{slot.count}</td>
                          <td className="tnum py-2 font-semibold text-ink">
                            {formatPrice(slot.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </figure>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { AlertCircle, Check, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui/primitives";
import type { CityAvailability } from "@/lib/availability";
import type { SiteContentData } from "@/lib/content";

type Props = {
  selectedCityId: string | null;
  onSelect: (city: CityAvailability) => void;
  messages: SiteContentData["wizard"];
};

export function CityPicker({ selectedCityId, onSelect, messages }: Props) {
  const [cities, setCities] = React.useState<CityAvailability[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setCities(null);
    setError(null);

    fetch("/api/cities", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error.message);
        setCities(data.cities);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "טעינת הערים נכשלה");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="size-6" />}
        title="לא הצלחנו לטעון את רשימת הערים"
        body={error}
      />
    );
  }

  if (!cities) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton h-[104px]" />
        ))}
      </div>
    );
  }

  if (cities.length === 0) {
    return (
      <EmptyState
        icon={<MapPin className="size-6" />}
        title="אין ערים פתוחות כרגע"
        body="כל המהדורות נסגרו להזמנות. השאירו פרטים ונעדכן כשנפתחת מהדורה חדשה."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cities.map((city, index) => {
        const selected = selectedCityId === city.id;
        const blocked = !city.available;
        const reason = city.isFull ? messages.cityFullMessage : null;

        return (
          <button
            key={city.id}
            type="button"
            disabled={blocked}
            onClick={() => onSelect(city)}
            style={{ animationDelay: `${index * 35}ms` }}
            className={cn(
              "relative flex flex-col items-start gap-2 rounded-lg border p-4 text-right",
              "transition-[transform,box-shadow,border-color,background-color] duration-200 ease-smooth",
              "animate-[fade-up_0.45s_var(--ease-out-soft)_both]",
              blocked
                ? "cursor-not-allowed border-line bg-surface-3 opacity-70"
                : selected
                  ? "cursor-pointer border-accent bg-accent-soft shadow-e2"
                  : "cursor-pointer border-line bg-surface shadow-e1 hover:-translate-y-1 hover:border-accent hover:shadow-e3",
            )}
          >
            {selected ? (
              <span className="absolute left-3 top-3 grid size-6 place-items-center rounded-full bg-accent text-accent-ink">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            ) : null}

            <div className="flex items-center gap-2">
              <MapPin
                className={cn(
                  "size-4",
                  blocked ? "text-muted" : "text-accent",
                )}
              />
              <span className="font-display text-lg font-semibold text-ink">
                {city.name}
              </span>
            </div>

            {city.region ? (
              <span className="text-[12px] text-muted">{city.region}</span>
            ) : null}

            <div className="mt-auto flex w-full flex-wrap items-center gap-2 pt-1">
              {blocked ? (
                <Badge tone="neutral">מלאה</Badge>
              ) : (
                <Badge tone={city.remaining <= 3 ? "warn" : "success"}>
                  {city.remaining <= 3
                    ? `נותרו ${city.remaining} משבצות`
                    : `${city.remaining} משבצות פנויות`}
                </Badge>
              )}

              {city.distribution ? (
                <span className="tnum inline-flex items-center gap-1 text-[11.5px] text-muted">
                  <Users className="size-3" />
                  {city.distribution.toLocaleString("he-IL")} לוחות
                </span>
              ) : null}
            </div>

            {reason ? (
              <p className="mt-1 text-[11.5px] leading-snug text-warn">
                {reason}
              </p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

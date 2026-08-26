"use client";

import * as React from "react";
import { AlertCircle, Check, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { WBadge } from "./ui";
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-14 text-center soft-shadow">
        <div className="mb-4 grid size-14 place-items-center rounded-full bg-secondary text-muted-foreground">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          לא הצלחנו לטעון את רשימת הערים
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!cities) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton h-[104px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (cities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-14 text-center soft-shadow">
        <div className="mb-4 grid size-14 place-items-center rounded-full bg-secondary text-muted-foreground">
          <MapPin className="size-6" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          אין ערים פתוחות כרגע
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          כל המהדורות נסגרו להזמנות. השאירו פרטים ונעדכן כשנפתחת מהדורה חדשה.
        </p>
      </div>
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
              "relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-right",
              "transition-[transform,box-shadow,border-color,background-color] duration-200 ease-smooth",
              "animate-[fade-up_0.45s_var(--ease-out-soft)_both]",
              blocked
                ? "cursor-not-allowed border-border bg-muted/40 opacity-70"
                : selected
                  ? "cursor-pointer border-primary bg-secondary/60 soft-shadow"
                  : "cursor-pointer border-border bg-card soft-shadow hover:-translate-y-1 hover:border-primary/60",
            )}
          >
            {selected ? (
              <span className="absolute left-3 top-3 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            ) : null}

            <div className="flex items-center gap-2">
              <MapPin
                className={cn(
                  "size-4",
                  blocked ? "text-muted-foreground" : "text-primary",
                )}
              />
              <span className="font-heading text-lg font-semibold text-foreground">
                {city.name}
              </span>
            </div>

            {city.region ? (
              <span className="text-[12px] text-muted-foreground">{city.region}</span>
            ) : null}

            <div className="mt-auto flex w-full flex-wrap items-center gap-2 pt-1">
              {blocked ? (
                <WBadge tone="neutral">מלאה</WBadge>
              ) : (
                <WBadge tone={city.remaining <= 3 ? "warn" : "success"}>
                  {city.remaining <= 3
                    ? `נותרו ${city.remaining} משבצות`
                    : `${city.remaining} משבצות פנויות`}
                </WBadge>
              )}

              {city.distribution ? (
                <span className="tnum inline-flex items-center gap-1 text-[11.5px] text-muted-foreground">
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

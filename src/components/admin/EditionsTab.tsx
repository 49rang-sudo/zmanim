"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { toast } from "sonner";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Field, Input, Textarea } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type AdminCity = { id: string; name: string; capacity: number };

type AdminEdition = {
  id: string;
  cityId: string;
  cityName: string;
  hebrewLabel: string;
  gregorianMonth: number;
  gregorianYear: number;
  capacity: number;
  taken: number;
  remaining: number;
  isFull: boolean;
  closesAt: string;
  status: "OPEN" | "CLOSED";
  marketingNote: string | null;
};

export function EditionsTab() {
  const [cities, setCities] = React.useState<AdminCity[] | null>(null);
  const [editions, setEditions] = React.useState<AdminEdition[] | null>(null);
  const [cityFilter, setCityFilter] = React.useState("ALL");
  const [adding, setAdding] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const loadCities = React.useCallback(async () => {
    const res = await fetch("/api/admin/cities", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error?.message ?? "טעינת הערים נכשלה");
      return;
    }
    setCities(data.cities);
  }, []);

  const loadEditions = React.useCallback(async (cityId: string) => {
    const res = await fetch(`/api/admin/editions?cityId=${cityId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error?.message ?? "טעינת המהדורות נכשלה");
      setEditions([]);
      return;
    }
    setEditions(data.editions);
  }, []);

  React.useEffect(() => {
    loadCities();
  }, [loadCities]);

  React.useEffect(() => {
    loadEditions(cityFilter);
  }, [cityFilter, loadEditions]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/editions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error?.message ?? "העדכון נכשל");
    }
    loadEditions(cityFilter);
  };

  const remove = async (edition: AdminEdition) => {
    if (!confirm(`למחוק את ${edition.hebrewLabel} — ${edition.cityName}?`)) {
      return;
    }
    const res = await fetch(`/api/admin/editions/${edition.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error?.message ?? "המחיקה נכשלה");
      return;
    }
    toast.success("המהדורה נמחקה");
    loadEditions(cityFilter);
  };

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/editions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cityId: form.get("cityId"),
        hebrewLabel: form.get("hebrewLabel"),
        gregorianMonth: Number(form.get("gregorianMonth")),
        gregorianYear: Number(form.get("gregorianYear")),
        capacity: Number(form.get("capacity")),
        closesAt: form.get("closesAt"),
        status: "OPEN",
        marketingNote: form.get("marketingNote") || null,
      }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      toast.error(data?.error?.message ?? "יצירת המהדורה נכשלה");
      return;
    }

    toast.success("המהדורה נוצרה");
    setAdding(false);
    loadEditions(cityFilter);
  };

  const selectedCityForDefault = cities?.find(
    (c) => c.id === (cityFilter !== "ALL" ? cityFilter : cities?.[0]?.id),
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          כל מהדורה היא חודש דפוס אחד של עיר אחת. המלאי (משבצות פנויות/תפוסות)
          נספר ונחסם ברמת המהדורה, לא ברמת העיר.
        </p>
        <Button size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="size-4" />
          מהדורה חדשה
        </Button>
      </div>

      <div className="mb-5 flex items-center gap-2">
        <label className="text-[13px] text-muted-foreground" htmlFor="city-filter">
          סינון לפי עיר:
        </label>
        <select
          id="city-filter"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-1.5 text-[13px] text-foreground"
        >
          <option value="ALL">כל הערים</option>
          {cities?.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      {adding ? (
        <form
          onSubmit={create}
          className="mb-6 rounded-2xl border border-primary/30 bg-secondary/40 p-5"
        >
          <div className="grid gap-x-4 sm:grid-cols-3">
            <Field label="עיר *" htmlFor="cityId">
              <select
                id="cityId"
                name="cityId"
                required
                defaultValue={selectedCityForDefault?.id}
                onChange={(e) => {
                  const city = cities?.find((c) => c.id === e.target.value);
                  const capacityInput = document.getElementById(
                    "new-edition-capacity",
                  ) as HTMLInputElement | null;
                  if (city && capacityInput) {
                    capacityInput.value = String(city.capacity);
                  }
                }}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-[13px] text-foreground"
              >
                {cities?.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="תווית עברית *" htmlFor="hebrewLabel" hint="למשל: כסלו תשפ״ז">
              <Input id="hebrewLabel" name="hebrewLabel" required minLength={1} />
            </Field>
            <Field label="קיבולת *" htmlFor="new-edition-capacity">
              <Input
                id="new-edition-capacity"
                name="capacity"
                type="number"
                min={1}
                max={200}
                defaultValue={selectedCityForDefault?.capacity ?? 14}
                required
              />
            </Field>
            <Field label="חודש לועזי (1-12) *" htmlFor="gregorianMonth">
              <Input
                id="gregorianMonth"
                name="gregorianMonth"
                type="number"
                min={1}
                max={12}
                required
              />
            </Field>
            <Field label="שנה לועזית *" htmlFor="gregorianYear">
              <Input
                id="gregorianYear"
                name="gregorianYear"
                type="number"
                min={2020}
                max={2100}
                required
              />
            </Field>
            <Field label="סגירת הזמנות/העלאות *" htmlFor="closesAt">
              <Input id="closesAt" name="closesAt" type="date" required />
            </Field>
          </div>

          <Field
            label="למה לפרסם דווקא בחודש הזה (אופציונלי)"
            htmlFor="marketingNote"
            hint="מוצג ללקוח בזמן דפדוף בין החודשים באשף ההזמנה"
          >
            <Textarea id="marketingNote" name="marketingNote" maxLength={400} />
          </Field>

          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={busy}>
              יצירה
            </Button>
            <Button
              type="button"
              size="sm"
              variant="quiet"
              onClick={() => setAdding(false)}
            >
              ביטול
            </Button>
          </div>
        </form>
      ) : null}

      {editions === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : editions.length === 0 ? (
        <p className="rounded-2xl border border-border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
          אין מהדורות עדיין. אפשר ליצור אחת עם הכפתור למעלה.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {editions.map((edition) => (
            <div
              key={edition.id}
              className={cn(
                "rounded-2xl border bg-card p-5 soft-shadow",
                edition.status === "OPEN"
                  ? "border-border"
                  : "border-border opacity-70",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-primary" />
                    <h3 className="font-heading text-lg font-extrabold text-foreground">
                      {edition.hebrewLabel}
                    </h3>
                    {edition.isFull ? <Badge tone="warn">מלאה</Badge> : null}
                    {edition.status === "CLOSED" ? (
                      <Badge tone="neutral">סגורה</Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    {edition.cityName} · {edition.gregorianMonth}/
                    {edition.gregorianYear}
                  </p>
                </div>

                <Button
                  variant="quiet"
                  size="icon"
                  aria-label={`מחיקת ${edition.hebrewLabel}`}
                  onClick={() => remove(edition)}
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>

              {/* מד תפוסה */}
              <div className="mt-4">
                <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
                  <span className="text-muted-foreground">תפוסה</span>
                  <span className="tnum font-semibold text-foreground">
                    {edition.taken} / {edition.capacity}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-300 ease-smooth",
                      edition.isFull ? "bg-warn" : "bg-primary",
                    )}
                    style={{
                      width: `${Math.min(100, (edition.taken / edition.capacity) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-[12.5px]">
                  <span className="mb-1 block text-muted-foreground">קיבולת</span>
                  <Input
                    type="number"
                    min={edition.taken || 1}
                    max={200}
                    defaultValue={edition.capacity}
                    className="py-1.5 text-[13px]"
                    onBlur={(e) => {
                      const value = Number(e.target.value);
                      if (value !== edition.capacity) {
                        patch(edition.id, { capacity: value });
                      }
                    }}
                  />
                </label>

                <label className="text-[12.5px]">
                  <span className="mb-1 block text-muted-foreground">סגירת הזמנות</span>
                  <Input
                    type="date"
                    defaultValue={edition.closesAt.slice(0, 10)}
                    className="py-1.5 text-[13px]"
                    onBlur={(e) => {
                      if (!e.target.value) return;
                      patch(edition.id, { closesAt: e.target.value });
                    }}
                  />
                </label>
              </div>

              <label className="mt-3 block text-[12.5px]">
                <span className="mb-1 block text-muted-foreground">
                  למה לפרסם דווקא בחודש הזה
                </span>
                <Textarea
                  defaultValue={edition.marketingNote ?? ""}
                  maxLength={400}
                  className="py-1.5 text-[13px]"
                  placeholder="אופציונלי — מוצג ללקוח באשף ההזמנה"
                  onBlur={(e) => {
                    const value = e.target.value.trim() || null;
                    if (value !== edition.marketingNote) {
                      patch(edition.id, { marketingNote: value });
                    }
                  }}
                />
              </label>

              <div className="mt-4 border-t border-border pt-4">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="text-[13px] text-muted-foreground">
                    פתוחה להזמנות
                  </span>
                  <SwitchPrimitive.Root
                    checked={edition.status === "OPEN"}
                    onCheckedChange={(checked) =>
                      patch(edition.id, {
                        status: checked ? "OPEN" : "CLOSED",
                      })
                    }
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full border border-border",
                      "transition-colors duration-200 ease-smooth",
                      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-secondary",
                    )}
                  >
                    <SwitchPrimitive.Thumb
                      className={cn(
                        "block size-[18px] rounded-full bg-card soft-shadow",
                        "transition-transform duration-200 ease-smooth",
                        "translate-x-[-2px] data-[state=checked]:translate-x-[-22px]",
                      )}
                    />
                  </SwitchPrimitive.Root>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

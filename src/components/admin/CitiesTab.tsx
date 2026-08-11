"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { toast } from "sonner";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Field, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type AdminCity = {
  id: string;
  name: string;
  region: string | null;
  capacity: number;
  distribution: number | null;
  visible: boolean;
  autoHideWhenFull: boolean;
};

export function CitiesTab() {
  const [cities, setCities] = React.useState<AdminCity[] | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/cities", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error?.message ?? "טעינת הערים נכשלה");
      setCities([]);
      return;
    }
    setCities(data.cities);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/cities/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data?.error?.message ?? "העדכון נכשל");
      load();
      return;
    }
    load();
  };

  const remove = async (city: AdminCity) => {
    if (!confirm(`למחוק את ${city.name}? הפעולה אינה הפיכה.`)) return;

    const res = await fetch(`/api/admin/cities/${city.id}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data?.error?.message ?? "המחיקה נכשלה");
      return;
    }
    toast.success(`${city.name} נמחקה`);
    load();
  };

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/cities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        region: form.get("region") || null,
        capacity: Number(form.get("capacity")),
        distribution: form.get("distribution")
          ? Number(form.get("distribution"))
          : null,
        visible: true,
        autoHideWhenFull: false,
      }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      toast.error(data?.error?.message ?? "הוספת העיר נכשלה");
      return;
    }

    toast.success("העיר נוספה");
    setAdding(false);
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-2">
          לכל עיר מהדורת דפוס נפרדת. הקיבולת קובעת כמה משבצות נמכרות בה.
        </p>
        <Button size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="size-4" />
          עיר חדשה
        </Button>
      </div>

      {adding ? (
        <form
          onSubmit={create}
          className="mb-6 rounded-lg border border-accent bg-accent-soft p-5"
        >
          <div className="grid gap-x-4 sm:grid-cols-4">
            <Field label="שם העיר *" htmlFor="name">
              <Input id="name" name="name" required minLength={2} />
            </Field>
            <Field label="אזור" htmlFor="region">
              <Input id="region" name="region" />
            </Field>
            <Field label="קיבולת משבצות *" htmlFor="capacity">
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                max={200}
                defaultValue={14}
                required
              />
            </Field>
            <Field label="כמות בהפצה" htmlFor="distribution">
              <Input
                id="distribution"
                name="distribution"
                type="number"
                min={0}
              />
            </Field>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={busy}>
              הוספה
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

      {cities === null ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {cities.map((city) => (
            <div
              key={city.id}
              className={cn(
                "rounded-lg border bg-surface p-5 shadow-e1",
                city.visible ? "border-line" : "border-line-2 opacity-70",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-accent" />
                    <h3 className="font-display text-lg font-semibold text-ink">
                      {city.name}
                    </h3>
                    {!city.visible ? (
                      <Badge tone="neutral">מוסתרת</Badge>
                    ) : null}
                  </div>
                  {city.region ? (
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {city.region}
                    </p>
                  ) : null}
                </div>

                <Button
                  variant="quiet"
                  size="icon"
                  aria-label={`מחיקת ${city.name}`}
                  onClick={() => remove(city)}
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-[12.5px]">
                  <span className="mb-1 block text-muted">
                    קיבולת ברירת מחדל למהדורות חדשות
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    defaultValue={city.capacity}
                    className="py-1.5 text-[13px]"
                    onBlur={(e) => {
                      const value = Number(e.target.value);
                      if (value !== city.capacity) {
                        patch(city.id, { capacity: value });
                      }
                    }}
                  />
                </label>

                <label className="text-[12.5px]">
                  <span className="mb-1 block text-muted">כמות בהפצה</span>
                  <Input
                    type="number"
                    min={0}
                    defaultValue={city.distribution ?? ""}
                    className="py-1.5 text-[13px]"
                    onBlur={(e) => {
                      const value = e.target.value
                        ? Number(e.target.value)
                        : null;
                      if (value !== city.distribution) {
                        patch(city.id, { distribution: value });
                      }
                    }}
                  />
                </label>
              </div>

              <div className="mt-4 space-y-2.5 border-t border-line pt-4">
                <Toggle
                  label="מוצגת בבורר הערים"
                  checked={city.visible}
                  onChange={(value) => patch(city.id, { visible: value })}
                />
                <Toggle
                  label="הסתרה אוטומטית כשהמלאי נגמר"
                  checked={city.autoHideWhenFull}
                  onChange={(value) =>
                    patch(city.id, { autoHideWhenFull: value })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-[13px] text-ink-2">{label}</span>
      <SwitchPrimitive.Root
        checked={checked}
        onCheckedChange={onChange}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border border-line",
          "transition-colors duration-200 ease-smooth",
          "data-[state=checked]:bg-accent data-[state=unchecked]:bg-surface-3",
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "block size-[18px] rounded-full bg-surface shadow-e1",
            "transition-transform duration-200 ease-smooth",
            "translate-x-[-2px] data-[state=checked]:translate-x-[-22px]",
          )}
        />
      </SwitchPrimitive.Root>
    </label>
  );
}

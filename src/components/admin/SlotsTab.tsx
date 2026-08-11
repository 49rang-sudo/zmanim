"use client";

import * as React from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Field, Input, Textarea } from "@/components/ui/primitives";
import { formatCm, formatPrice } from "@/lib/utils";

type AdminSlot = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  widthCm: number;
  heightCm: number;
  priceAgorot: number;
  badge: string | null;
  active: boolean;
  citiesAvailable: number;
  soldCount: number;
};

export function SlotsTab() {
  const [slots, setSlots] = React.useState<AdminSlot[] | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/slots", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error?.message ?? "טעינת המשבצות נכשלה");
      setSlots([]);
      return;
    }
    setSlots(data.slots);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async (slot: AdminSlot, form: HTMLFormElement) => {
    setSaving(slot.id);
    const data = new FormData(form);

    const res = await fetch(`/api/admin/slots/${slot.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        description: data.get("description") || null,
        priceShekels: Number(data.get("price")),
        badge: data.get("badge") || null,
        active: data.get("active") === "on",
      }),
    });

    const body = await res.json();
    setSaving(null);

    if (!res.ok) {
      toast.error(body?.error?.message ?? "השמירה נכשלה");
      return;
    }

    toast.success(`${slot.sku} נשמר`);
    load();
  };

  if (slots === null) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-32" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4">
        {slots.map((slot) => (
          <form
            key={slot.id}
            onSubmit={(event) => {
              event.preventDefault();
              save(slot, event.currentTarget);
            }}
            className="rounded-lg border border-line bg-surface p-5 shadow-e1"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="tnum font-semibold text-ink">{slot.sku}</span>
              <Badge tone="neutral">
                {formatCm(slot.widthCm, slot.heightCm)}
              </Badge>
              <Badge tone={slot.citiesAvailable > 0 ? "success" : "warn"}>
                {slot.citiesAvailable > 0
                  ? `${slot.citiesAvailable} ערים פנויות`
                  : "אזלה בכל הערים"}
              </Badge>
              {slot.soldCount > 0 ? (
                <Badge tone="accent">{slot.soldCount} נמכרו</Badge>
              ) : null}

              <span className="tnum mr-auto font-display text-lg font-bold text-accent">
                {formatPrice(slot.priceAgorot)}
              </span>
            </div>

            <div className="grid gap-x-4 sm:grid-cols-3">
              <Field label="שם המשבצת" htmlFor={`name-${slot.id}`}>
                <Input
                  id={`name-${slot.id}`}
                  name="name"
                  defaultValue={slot.name}
                />
              </Field>

              <Field label="מחיר בשקלים" htmlFor={`price-${slot.id}`}>
                <Input
                  id={`price-${slot.id}`}
                  name="price"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={(slot.priceAgorot / 100).toString()}
                />
              </Field>

              <Field
                label="תגית"
                htmlFor={`badge-${slot.id}`}
                hint="למשל: פרימיום"
              >
                <Input
                  id={`badge-${slot.id}`}
                  name="badge"
                  defaultValue={slot.badge ?? ""}
                />
              </Field>
            </div>

            <Field label="תיאור בטולטיפ" htmlFor={`desc-${slot.id}`}>
              <Textarea
                id={`desc-${slot.id}`}
                name="description"
                defaultValue={slot.description ?? ""}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-2">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={slot.active}
                  className="size-4 accent-[var(--color-accent)]"
                />
                מוצגת בעמוד ההזמנה
              </label>

              <Button
                type="submit"
                size="sm"
                className="mr-auto"
                loading={saving === slot.id}
              >
                <Save className="size-3.5" />
                שמירה
              </Button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}

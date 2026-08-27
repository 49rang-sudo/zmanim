"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ChevronRight,
  ImageIcon,
  Loader2,
  Lock,
  Plus,
  Save,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Field, Input } from "@/components/ui/primitives";
import { cn, formatPrice } from "@/lib/utils";
import { HOTSPOT_ACCENT, HOTSPOT_BROWN, HOTSPOT_CREAM } from "@/lib/hotspot-colors";

/* ---------------------------------------------------------------
   פורטינג של zmanim2-base44/src/components/admin/AdPositionsVisualEditor.jsx
   + MonthTemplateSection.jsx לאתר האמיתי (שלב 5 בתוכנית המיגרציה).

   הבדל מכוון מהמקור: בבייס44 העורך רק עורך label/category — הגיאומטריה
   (x/y/w/h) הייתה קבועה מראש בתבנית ולא ניתנת לעריכה מה-UI. כאן היא
   כן ניתנת לעריכה (שדות מספריים), כי זו הבקשה המפורשת של בעלת האתר:
   "תמיד יהיה אותן תמונות עם אפשרות להזיז את הריבועים... ולערוך את
   הטקסט שבתוכן". זו התוספת האמיתית היחידה מעבר לפורט המילולי.

   טוקנים: כרום האדמין (canvas/surface/ink) בכל מה שסביב — לא טוקני
   בייס44 (background/foreground/card), שמיועדים במפורש לדף השיווקי
   בלבד (ראו ההערה ב-globals.css). ריבועי ה-Hotspot עצמם משתמשים
   בקבועי CREAM/BROWN/ACCENT הליטרליים (src/lib/hotspot-colors.ts) —
   חריגה מכוונת וצרה, כדי שמה שהמנהלת עורכת ייראה זהה למה שהמבקרים
   רואים ב-CalendarMockup.tsx.
   --------------------------------------------------------------- */

type AdminHotspotSlot = {
  id: string;
  sku: string;
  name: string;
  priceAgorot: number;
  active: boolean;
  /** true אם יש לו ולו SlotReservation אחד — נחסם גם בשרת, לא רק כאן */
  locked: boolean;
};

type AdminHotspot = {
  id: string;
  inspirationImageId: string;
  category: string;
  tier: "ANCHOR" | "COMPLEMENTARY";
  x: number;
  y: number;
  width: number;
  height: number;
  priceAgorot: number;
  active: boolean;
  sortOrder: number;
  slot: AdminHotspotSlot | null;
};

type AdminInspirationImage = {
  id: string;
  label: string;
  gregorianMonth: number | null;
  imageUrl: string;
  aspectRatio: number;
  active: boolean;
  sortOrder: number;
  hotspots: AdminHotspot[];
};

const TIER_LABEL: Record<AdminHotspot["tier"], string> = {
  ANCHOR: "עוגן",
  COMPLEMENTARY: "משלים",
};

const monthFormatter = new Intl.DateTimeFormat("he-IL", { month: "long" });

function monthLabel(month: number | null): string {
  if (month == null) return "כללי — גיבוי לחודש בלי תמונה ייעודית";
  return monthFormatter.format(new Date(2000, month - 1, 1));
}

async function uploadMedia(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/media", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "העלאת התמונה נכשלה");
  return data.url as string;
}

export function InspirationImagesTab() {
  const [images, setImages] = React.useState<AdminInspirationImage[] | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [addingMonth, setAddingMonth] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/inspiration-images", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error?.message ?? "טעינת ספריית התמונות נכשלה");
      setImages([]);
      return;
    }
    setImages(data.images);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const selected = images?.find((i) => i.id === selectedId) ?? null;

  if (images === null) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-32" />
        ))}
      </div>
    );
  }

  if (selected) {
    return (
      <ImageEditor
        image={selected}
        onBack={() => setSelectedId(null)}
        onReload={load}
      />
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-xl font-semibold text-ink">
          תמונות והשראה
        </h2>
        <p className="mt-1 text-sm text-ink-2">
          ספרייה קבועה של תמונות קונספט לפי חודש — לא נוצרות תמונות חדשות
          לכל מהדורה. לוחצים על תמונה כדי להזיז את ריבועי הפרסום עליה
          ולערוך את הקטגוריה שבתוכם. מקומות שכבר נמכרו/שוריינו מוצגים
          נעולים ולא ניתנים לעריכה כאן בכלל.
        </p>
      </div>

      {images.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface-2 p-6 text-center text-sm text-muted">
          אין עדיין אף תמונת השראה.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedId(image.id)}
              className={cn(
                "flex flex-col overflow-hidden rounded-lg border bg-surface text-right shadow-e1",
                "transition-[transform,box-shadow,border-color] duration-200 ease-smooth",
                "hover:-translate-y-0.5 hover:shadow-e3 hover:border-accent",
                image.active ? "border-line" : "border-line-2 opacity-60",
              )}
            >
              <div className="relative aspect-[4/3] w-full bg-surface-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.imageUrl}
                  alt={image.label}
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
              <div className="p-3.5">
                <div className="flex items-center gap-1.5">
                  <Badge tone="neutral">{monthLabel(image.gregorianMonth)}</Badge>
                  {!image.active ? <Badge tone="warn">מוסתרת</Badge> : null}
                </div>
                <div className="mt-1.5 font-semibold text-ink">{image.label}</div>
                <div className="mt-0.5 text-[12.5px] text-muted">
                  {image.hotspots.length} חלונות פרסום
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 border-t border-line pt-6">
        <Button variant="subtle" size="sm" onClick={() => setAddingMonth((v) => !v)}>
          <Plus className="size-4" />
          איתחול תמונה לחודש שעדיין חסר לגמרי בספרייה
        </Button>
        {addingMonth ? (
          <NewMonthImageForm
            onCreated={async () => {
              setAddingMonth(false);
              await load();
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function NewMonthImageForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [label, setLabel] = React.useState("");
  const [month, setMonth] = React.useState<string>("1");
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!label.trim() || !file) {
      toast.error("יש להזין שם ולבחור קובץ תמונה");
      return;
    }
    setBusy(true);
    try {
      const imageUrl = await uploadMedia(file);
      const res = await fetch("/api/admin/inspiration-images", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          gregorianMonth: month === "GENERAL" ? null : Number(month),
          imageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "היצירה נכשלה");
        return;
      }
      toast.success("תמונת ההשראה נוצרה");
      setLabel("");
      setFile(null);
      await onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "היצירה נכשלה");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mt-4 grid gap-x-4 rounded-lg border border-accent bg-accent-soft p-5 sm:grid-cols-3"
    >
      <Field label="שם פנימי" htmlFor="new-image-label" hint='למשל "קיר מטבח"'>
        <Input
          id="new-image-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
      </Field>
      <Field label="חודש">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
          <option value="GENERAL">כללי (גיבוי לכל חודש)</option>
        </select>
      </Field>
      <Field label="קובץ תמונה">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-[13px] text-ink-2"
        />
      </Field>
      <div className="sm:col-span-3">
        <Button type="submit" size="sm" loading={busy}>
          <Upload className="size-4" />
          יצירה
        </Button>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------
   עורך תמונה אחת — הליבה: תמונה מוגדלת עם כל ה-Hotspot-ים שלה
   ---------------------------------------------------------------- */

function ImageEditor({
  image,
  onBack,
  onReload,
}: {
  image: AdminInspirationImage;
  onBack: () => void;
  onReload: () => Promise<void>;
}) {
  const [selectedHotspotId, setSelectedHotspotId] = React.useState<string | null>(null);
  const [addingHotspot, setAddingHotspot] = React.useState(false);
  const [swappingImage, setSwappingImage] = React.useState(false);

  const selectedHotspot = image.hotspots.find((h) => h.id === selectedHotspotId) ?? null;

  const selectHotspot = (h: AdminHotspot) => {
    if (h.slot?.locked) return; // נעול — אין בכלל onClick, כמו בבייס44
    setSelectedHotspotId((cur) => (cur === h.id ? null : h.id));
  };

  const addHotspot = async () => {
    setAddingHotspot(true);
    try {
      const res = await fetch("/api/admin/hotspots", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          inspirationImageId: image.id,
          category: "עסק חדש",
          tier: "COMPLEMENTARY",
          x: 40,
          y: 40,
          width: 16,
          height: 13,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "יצירת החלון נכשלה");
        return;
      }
      toast.success("חלון חדש נוצר — אפשר לערוך ולמקם אותו");
      setSelectedHotspotId(data.hotspot.id);
      await onReload();
    } finally {
      setAddingHotspot(false);
    }
  };

  const swapImage = async (file: File) => {
    setSwappingImage(true);
    try {
      const imageUrl = await uploadMedia(file);
      const res = await fetch(`/api/admin/inspiration-images/${image.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "החלפת התמונה נכשלה");
        return;
      }
      toast.success("התמונה הוחלפה");
      await onReload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "החלפת התמונה נכשלה");
    } finally {
      setSwappingImage(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ChevronRight className="size-3.5" />
        חזרה לכל התמונות
      </button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="size-4 text-accent" />
            <h2 className="font-display text-xl font-semibold text-ink">
              {image.label}
            </h2>
            <Badge tone="neutral">{monthLabel(image.gregorianMonth)}</Badge>
          </div>
          <p className="mt-1 text-[12.5px] text-muted">
            {image.hotspots.length} חלונות פרסום · לוחצים על חלון פנוי כדי לערוך
            אותו, לוחצים שוב כדי לבטל בחירה
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink-2 hover:border-line-2">
          {swappingImage ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          החלפת התמונה
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={swappingImage}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) swapImage(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {/* ============ התמונה המוגדלת עם כל ריבועי הפרסום ============ */}
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-lg border border-line"
        style={{ aspectRatio: `${image.aspectRatio}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.imageUrl}
          alt={image.label}
          className="absolute inset-0 size-full object-cover"
        />

        {image.hotspots.map((h) => {
          const locked = !!h.slot?.locked;
          const editable = !locked;
          const isSelected = selectedHotspotId === h.id;

          return (
            <div
              key={h.id}
              role={editable ? "button" : undefined}
              tabIndex={editable ? 0 : -1}
              aria-pressed={editable ? isSelected : undefined}
              onClick={editable ? () => selectHotspot(h) : undefined}
              onKeyDown={
                editable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectHotspot(h);
                      }
                    }
                  : undefined
              }
              className={cn(
                "absolute z-10 flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg p-1.5 text-center transition",
                editable ? "cursor-pointer hover:brightness-95" : "cursor-not-allowed",
              )}
              style={{
                insetInlineStart: `${h.x}%`,
                top: `${h.y}%`,
                width: `${h.width}%`,
                height: `${h.height}%`,
                background: isSelected
                  ? `${HOTSPOT_ACCENT}66`
                  : editable
                    ? "rgba(255,255,255,0.55)"
                    : `${HOTSPOT_BROWN}26`,
                border: isSelected
                  ? `2px solid ${HOTSPOT_BROWN}`
                  : editable
                    ? `1px dashed ${HOTSPOT_BROWN}77`
                    : `1px solid ${HOTSPOT_BROWN}aa`,
              }}
            >
              <div className="flex items-center gap-1">
                {locked ? <Lock className="size-2.5" style={{ color: HOTSPOT_BROWN }} /> : null}
                <span
                  className="text-[9px] font-extrabold uppercase leading-none"
                  style={{ color: HOTSPOT_BROWN }}
                >
                  {TIER_LABEL[h.tier]}
                </span>
              </div>
              <span
                className="line-clamp-2 text-[10px] font-semibold leading-tight"
                style={{ color: HOTSPOT_BROWN }}
              >
                {h.category || "—"}
              </span>
              {locked ? (
                <span className="text-[9px]" style={{ color: HOTSPOT_BROWN }}>
                  נמכר/משוריין
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <Button variant="subtle" size="sm" onClick={addHotspot} loading={addingHotspot}>
          <Plus className="size-4" />
          הוספת חלון פרסום חדש
        </Button>
      </div>

      {/* ============ פאנל עריכה ============ */}
      <div className="mt-5 border-t border-line pt-5">
        {!selectedHotspot ? (
          <p className="text-sm text-muted">
            לחצו על חלון פנוי בתמונה כדי לערוך אותו כאן.
          </p>
        ) : (
          <HotspotEditPanel
            key={selectedHotspot.id}
            hotspot={selectedHotspot}
            onReload={onReload}
            onDeselect={() => setSelectedHotspotId(null)}
          />
        )}
      </div>
    </div>
  );
}

function HotspotEditPanel({
  hotspot,
  onReload,
  onDeselect,
}: {
  hotspot: AdminHotspot;
  onReload: () => Promise<void>;
  onDeselect: () => void;
}) {
  const [category, setCategory] = React.useState(hotspot.category);
  const [tier, setTier] = React.useState(hotspot.tier);
  const [x, setX] = React.useState(hotspot.x);
  const [y, setY] = React.useState(hotspot.y);
  const [width, setWidth] = React.useState(hotspot.width);
  const [height, setHeight] = React.useState(hotspot.height);
  const [active, setActive] = React.useState(hotspot.active);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hotspots/${hotspot.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category, tier, x, y, width, height, active }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "השמירה נכשלה");
        return;
      }
      toast.success("החלון עודכן");
      await onReload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl rounded-lg border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink">עריכת חלון פרסום</span>
        <button onClick={onDeselect} className="text-xs text-muted hover:text-ink">
          סגירה
        </button>
      </div>

      {hotspot.slot ? (
        <p className="mb-4 text-[12.5px] text-muted">
          מק״ט {hotspot.slot.sku} · המחיר הנגבה בפועל ({formatPrice(hotspot.slot.priceAgorot)})
          נערך בטאב &quot;משבצות&quot;.
        </p>
      ) : null}

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="קטגוריית עסק" htmlFor="hs-category">
          <Input
            id="hs-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </Field>
        <Field label="דרגה" htmlFor="hs-tier">
          <select
            id="hs-tier"
            value={tier}
            onChange={(e) => setTier(e.target.value as AdminHotspot["tier"])}
            className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
          >
            <option value="ANCHOR">עוגן</option>
            <option value="COMPLEMENTARY">משלים</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-x-4 sm:grid-cols-4">
        <Field label="X %" htmlFor="hs-x">
          <Input
            id="hs-x"
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={x}
            onChange={(e) => setX(Number(e.target.value))}
          />
        </Field>
        <Field label="Y %" htmlFor="hs-y">
          <Input
            id="hs-y"
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={y}
            onChange={(e) => setY(Number(e.target.value))}
          />
        </Field>
        <Field label="רוחב %" htmlFor="hs-w">
          <Input
            id="hs-w"
            type="number"
            min={1}
            max={100}
            step={0.5}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
        </Field>
        <Field label="גובה %" htmlFor="hs-h">
          <Input
            id="hs-h"
            type="number"
            min={1}
            max={100}
            step={0.5}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </Field>
      </div>

      <label className="mb-4 flex cursor-pointer items-center gap-2 text-[13px] text-ink-2">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4 accent-[var(--color-accent)]"
        />
        חלון פעיל (מוצג ללקוחות)
      </label>

      <Button size="sm" onClick={save} loading={saving}>
        <Save className="size-3.5" />
        שמירה
      </Button>
    </div>
  );
}

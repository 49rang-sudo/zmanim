"use client";

import { Check } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { packageTotalAgorotForEditions } from "@/lib/packages";
import type { MockupSlot } from "./CalendarMockup";
import type { EditionAvailability } from "@/lib/availability";

type Props = {
  slot: MockupSlot;
  currentEditionId: string;
  editions: EditionAvailability[];
  /** כמה חודשים בסך הכול צריך לבחור — נקבע בבחירת הדרגה ב-TierPicker */
  targetCount: number;
  selectedEditionIds: string[];
  onChange: (ids: string[]) => void;
};

/**
 * צ'קליסט "באילו חודשים בדיוק" — מוצג רק אחרי שנבחרה דרגת חבילה
 * (targetCount > 1) ב-TierPicker. רק מהדורות שבהן אותה משבצת
 * (slot.id) עדיין פנויה מוצעות — "מזהה קוביות זהות פנויות" בשביל
 * הלקוח, בלי שיצטרך לבדוק ידנית חודש-חודש. לא ניתן לסמן מעבר
 * ל-targetCount, כדי שהבחירה תישאר תואמת למחיר שכבר הוצג.
 */
export function EditionChecklist({
  slot,
  currentEditionId,
  editions,
  targetCount,
  selectedEditionIds,
  onChange,
}: Props) {
  const current = editions.find((e) => e.id === currentEditionId);
  const eligible = editions.filter(
    (e) =>
      e.id !== currentEditionId &&
      !e.isFull &&
      !e.occupiedSlotIds.includes(slot.id),
  );

  const toggle = (id: string) => {
    if (selectedEditionIds.includes(id)) {
      onChange(selectedEditionIds.filter((x) => x !== id));
      return;
    }
    if (selectedEditionIds.length >= targetCount) return;
    onChange([...selectedEditionIds, id]);
  };

  const total = packageTotalAgorotForEditions(
    slot.priceAgorot,
    selectedEditionIds.length,
  );
  const remaining = targetCount - selectedEditionIds.length;

  return (
    <div className="mt-6 rounded-lg border border-line bg-surface-2 p-5">
      <p className="text-[13.5px] font-semibold text-ink">
        {remaining > 0
          ? `בחרו עוד ${remaining} ${remaining === 1 ? "חודש" : "חודשים"} מתוך ${targetCount}`
          : `נבחרו ${targetCount} חודשים ✓`}
      </p>
      <p className="mt-1 text-[12.5px] text-ink-2">
        מוצגים רק חודשים שבהם אותה משבצת עדיין פנויה — כך אתם יודעים מראש
        שהמיקום שמור לכם בהם.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {current ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3 py-1.5 text-[12.5px] font-semibold text-accent-strong">
            <Check className="size-3.5" strokeWidth={3} />
            {current.hebrewLabel}
          </span>
        ) : null}

        {eligible.map((edition) => {
          const checked = selectedEditionIds.includes(edition.id);
          const disabled = !checked && selectedEditionIds.length >= targetCount;
          return (
            <button
              key={edition.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(edition.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold",
                "transition-colors duration-150 ease-smooth",
                checked
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : disabled
                    ? "cursor-not-allowed border-line bg-surface text-muted opacity-50"
                    : "border-line bg-surface text-ink-2 hover:border-line-2",
              )}
            >
              {checked ? <Check className="size-3.5" strokeWidth={3} /> : null}
              {edition.hebrewLabel}
            </button>
          );
        })}

        {eligible.length === 0 ? (
          <span className="text-[12.5px] text-muted">
            אין כרגע חודשים נוספים פנויים לאותה משבצת בעיר הזו.
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="text-[13px] text-ink-2">
          {selectedEditionIds.length > 1
            ? `${selectedEditionIds.length} מהדורות · 5% הנחה`
            : "מהדורה אחת"}
        </span>
        <span className="tnum font-display text-xl font-bold text-accent">
          {formatPrice(total)}
        </span>
      </div>
    </div>
  );
}

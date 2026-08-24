"use client";

import { Check } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import {
  AD_PACKAGES,
  packageTotalAgorotForEditions,
  perMonthAgorot,
  TIER_LABELS,
} from "@/lib/packages";
import type { MockupSlot } from "./CalendarMockup";

type Props = {
  slot: MockupSlot;
  /** null = עדיין לא נבחרה דרגה */
  selectedEditionsCount: number | null;
  onSelect: (editionsCount: number) => void;
};

/**
 * נבחר מיד אחרי בחירת המקום, לפני דפדוף בין חודשים — הלקוח רואה
 * קודם כל כמה זה עולה בפועל (בסכומים, לא באחוזים) ליחיד מול חבילה,
 * ורק אז ממשיך לבחור באילו חודשים בדיוק.
 *
 * הסולם תלוי בדרגת המקום שנבחר: לעוגן ולמשלים מחירון שונה לגמרי
 * (ראו src/lib/packages.ts), ולכן הכותרת אומרת במפורש על איזו
 * דרגה מדובר — אותם חמישה כפתורים במחירים אחרים זה בלבול מובטח.
 */
export function TierPicker({ slot, selectedEditionsCount, onSelect }: Props) {
  return (
    <div className="mt-6">
      <p className="mb-1 flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-ink">
        <span
          className={cn(
            "px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
            slot.tier === "ANCHOR"
              ? "bg-ink text-canvas"
              : "border border-line text-muted",
          )}
        >
          {TIER_LABELS[slot.tier]}
        </span>
        פרסום חד־פעמי או חבילה מרובת חודשים?
      </p>
      <p className="mb-3 text-[12px] text-muted">
        המחירים כוללים מע״מ. ככל שההתחייבות ארוכה יותר, המחיר לחודש יורד.
      </p>
      <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {AD_PACKAGES.map((pkg) => {
          const total = packageTotalAgorotForEditions(
            slot.priceAgorot,
            pkg.editions,
            slot.tier,
          );
          const monthly = perMonthAgorot(
            slot.tier,
            slot.priceAgorot,
            pkg.editions,
          );
          const selected = selectedEditionsCount === pkg.editions;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelect(pkg.editions)}
              className={cn(
                "relative rounded-md border p-3.5 text-right",
                "transition-colors duration-200 ease-smooth",
                selected
                  ? "border-accent bg-accent-soft"
                  : "border-line hover:border-line-2",
              )}
            >
              {selected ? (
                <span className="absolute left-2 top-2 grid size-5 place-items-center rounded-full bg-accent text-accent-ink">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              ) : null}
              <p className="text-[13px] font-semibold text-ink">{pkg.label}</p>
              <p className="mt-0.5 text-[12px] text-ink-2">
                {pkg.editions === 1 ? "חודש אחד" : `${pkg.editions} חודשים`}
              </p>
              <p className="tnum mt-1.5 font-display text-base font-bold text-accent">
                {formatPrice(total)}
              </p>
              {/* המחיר לחודש הוא מה שמשווים בפועל בין המדרגות —
                  הסכום הכולל לבדו מסתיר את הירידה. */}
              {pkg.editions > 1 ? (
                <p className="tnum mt-0.5 text-[11.5px] text-muted">
                  {formatPrice(monthly)} לחודש
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

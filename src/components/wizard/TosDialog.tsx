"use client";

import * as React from "react";
import { ScrollText } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { formatCm, formatPrice } from "@/lib/utils";
import type { SiteContentData } from "@/lib/content";
import type { MockupSlot } from "./CalendarMockup";

type Props = {
  slot: MockupSlot | null;
  tos: SiteContentData["tos"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
};

export function TosDialog({ slot, tos, open, onOpenChange, onAccept }: Props) {
  const [accepted, setAccepted] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // איפוס בכל פתיחה — אישור לא נגרר ממשבצת קודמת
  React.useEffect(() => {
    if (open) setAccepted(false);
  }, [open, slot?.id]);

  // הערה: היה כאן גייט "גללו לסוף התנאים". הוא נמחק בכוונה —
  // הוא חסם משתמשים שלא גללו, לא הוסיף תוקף משפטי, והאישור
  // המחייב הוא סימון התיבה, שנרשם בשרת עם חותמת זמן וגרסה.

  if (!slot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,680px)]">
        <DialogHeader>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="accent">
              <ScrollText className="size-3" />
              {slot.name}
            </Badge>
            <Badge tone="neutral">{formatCm(slot.widthCm, slot.heightCm)}</Badge>
            <Badge tone="neutral">{slot.sku}</Badge>
            <span className="tnum mr-auto font-display text-lg font-bold text-accent">
              {formatPrice(slot.priceAgorot)}
            </span>
          </div>

          <DialogTitle>{tos.title}</DialogTitle>
          <DialogDescription>{tos.intro}</DialogDescription>
        </DialogHeader>

        <DialogBody className="p-0">
          <div
            ref={scrollRef}
            className="max-h-[38dvh] overflow-y-auto overscroll-contain px-6 py-5"
          >
            <ol className="space-y-4">
              {tos.sections.map((section, index) => (
                <li key={index} className="flex gap-3">
                  <span className="tnum mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-[11px] font-bold text-ink-2">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-[15px] font-semibold text-ink">
                      {section.heading}
                    </h4>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
                      {section.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <label
            className={[
              "mx-6 my-4 flex cursor-pointer items-start gap-3 rounded-md border p-3.5",
              "transition-colors duration-200 ease-smooth",
              accepted
                ? "border-accent bg-accent-soft"
                : "border-line bg-surface-2 hover:border-line-2",
            ].join(" ")}
          >
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
            />
            <span className="text-[13.5px] font-medium leading-snug text-ink">
              {tos.acceptLabel}
            </span>
          </label>
        </DialogBody>

        <DialogFooter>
          <Button variant="quiet" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>

          <Button
            className="shine-cta"
            disabled={!accepted}
            onClick={() => {
              onAccept();
              onOpenChange(false);
            }}
          >
            אישור והמשך
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

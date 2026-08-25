"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
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
import { Field, Input } from "@/components/ui/primitives";
import {
  markInquirySubmitted,
  markPopupShown,
  popupAlreadyShown,
} from "@/lib/popup-session";
import type { SiteContentData } from "@/lib/content";

/* ===============================================================
   16 · פופאפ "בדקו לי מקום".

   הלקוחה הגדירה מתי הוא מוצג: "לאחר שהגולש עבר בין החודשים אך
   לא שלח טופס, או בניסיון יציאה מהעמוד". שני התנאים ממומשים
   כאן ממש, ולא כטיימר עיוור:

   · דפדוף בחודשים — IntersectionObserver על אזור החודשים
     (#months). רק מי שבאמת הגיע לשם ושהה SETTLE_MS נחשב
     "עבר בין החודשים". גולש שנחת ויצא מיד לא מקבל כלום.
   · כוונת יציאה — הסמן יוצא דרך שפת החלון העליונה, לכיוון
     סגירת הלשונית או שורת הכתובת. מזוין רק אחרי ARM_MS, כדי לא
     לתפוס תנועת עכבר מקרית בשנייה הראשונה.

   במובייל אין כוונת יציאה אמיתית (אין סמן), ואת טריק "בליעת"
   כפתור החזרה כבר תופס האשף. כאן משתמשים בתנאי הדפדוף בלבד —
   שני רכיבים שנלחמים על אותו ערך היסטוריה היו שוברים את כפתור
   החזרה של המכשיר.

   בכל מקרה, החלונית קופצת פעם אחת לכל ביקור לכל היותר, ובכלל
   לא למי שכבר שלח פנייה (ראו src/lib/popup-session.ts).
   =============================================================== */

/** כמה זמן אחרי הטעינה מותר לחלונית לקפוץ בכלל */
const ARM_MS = 8_000;
/** כמה זמן צריך לשהות באזור החודשים כדי שזה ייחשב "עבר ביניהם" */
const SETTLE_MS = 20_000;

const PHONE = /^[0-9+\-\s()]{9,20}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function InquiryPopup({ content }: { content: SiteContentData }) {
  const copy = content.landing.popup;
  const status = content.landing.status;

  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const firedRef = React.useRef(false);

  React.useEffect(() => {
    if (popupAlreadyShown()) return;

    let armed = false;
    let browsedTimer: number | undefined;

    const fire = () => {
      if (!armed || firedRef.current) return;
      firedRef.current = true;
      markPopupShown();
      setOpen(true);
    };

    const armTimer = window.setTimeout(() => {
      armed = true;
    }, ARM_MS);

    /* --- תנאי א׳: כוונת יציאה (דסקטופ) --- */
    const onMouseLeave = (event: MouseEvent) => {
      if (event.clientY <= 0) fire();
    };
    document.addEventListener("mouseleave", onMouseLeave);

    /* --- תנאי ב׳: עבר בין החודשים ולא שלח --- */
    const monthsSection = document.getElementById("months");
    const observer = monthsSection
      ? new IntersectionObserver(
          (entries) => {
            const visible = entries.some((entry) => entry.isIntersecting);
            if (visible && browsedTimer === undefined) {
              browsedTimer = window.setTimeout(fire, SETTLE_MS);
            } else if (!visible && browsedTimer !== undefined) {
              // יצא מהאזור לפני שהספיק לשהות — הספירה מתאפסת
              window.clearTimeout(browsedTimer);
              browsedTimer = undefined;
            }
          },
          { threshold: 0.25 },
        )
      : null;

    if (monthsSection && observer) observer.observe(monthsSection);

    return () => {
      window.clearTimeout(armTimer);
      if (browsedTimer !== undefined) window.clearTimeout(browsedTimer);
      document.removeEventListener("mouseleave", onMouseLeave);
      observer?.disconnect();
    };
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (category.trim().length < 2) {
      setError("נא לכתוב בכמה מילים מה העסק עושה");
      return;
    }
    const value = contact.trim();
    if (!EMAIL.test(value) && !PHONE.test(value)) {
      setError("נא להשאיר טלפון או כתובת מייל תקינים");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: "POPUP",
          category: category.trim(),
          contact: value,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? "השליחה נכשלה. נסו שוב בעוד רגע.");
        return;
      }

      markInquirySubmitted();
      setSent(true);
    } catch {
      setError("שגיאת רשת. נסו שוב.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[min(94vw,520px)]">
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <CheckCircle2 className="size-6 shrink-0 text-accent" />
                {status.inquiryReceived}
              </DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {copy.dismissLabel}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <DialogHeader>
              <DialogTitle className="text-xl">{copy.title}</DialogTitle>
              <DialogDescription className="whitespace-pre-line">
                {copy.body}
              </DialogDescription>
            </DialogHeader>

            <DialogBody>
              <Field label={copy.categoryLabel} htmlFor="popup-category">
                <Input
                  id="popup-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder={copy.categoryPlaceholder}
                />
              </Field>

              <Field label={copy.contactLabel} htmlFor="popup-contact">
                <Input
                  id="popup-contact"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder={copy.contactPlaceholder}
                />
              </Field>

              {error ? (
                <p className="border-e-2 border-danger pe-3 text-[13.5px] text-danger">
                  {error}
                </p>
              ) : null}
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="quiet"
                onClick={() => setOpen(false)}
              >
                {copy.dismissLabel}
              </Button>
              <Button type="submit" loading={busy} className="shine-cta">
                {copy.submitLabel}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

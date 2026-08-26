"use client";

import * as React from "react";
import { Mail } from "lucide-react";
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
import { WField as Field, WInput as Input } from "./ui";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecide: (joined: boolean) => void;
};

/**
 * מוקפצת רק בכוונת יציאה (exit-intent) — עצמאית לגמרי מהזמנה,
 * ולכן אוספת בעצמה את הפרטים ושולחת ל-/api/mailing-list.
 * בקשת לקוחה מפורשת: שם פרטי, שם משפחה, מייל וטלפון.
 */
export function MailingListDialog({ open, onOpenChange, onDecide }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const data = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/mailing-list", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: data.get("firstName"),
          lastName: data.get("lastName"),
          email: data.get("email"),
          phone: data.get("phone"),
        }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body?.error?.message ?? "ההצטרפות נכשלה, נסו שוב.");
        setBusy(false);
        return;
      }

      onDecide(true);
    } catch {
      setError("שגיאת רשת. נסו שוב.");
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,460px)] rounded-3xl border-border bg-card">
        <DialogHeader className="border-border">
          <div className="mb-3 grid size-11 place-items-center rounded-full bg-secondary text-primary">
            <Mail className="size-5" />
          </div>
          <DialogTitle className="text-foreground">עוד לא מוכנים להזמין?</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            הירשמו לעדכונים לקראת המהדורה הבאה וקבלו תזכורת לפני שכל המשבצות נתפסות.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form id="mailing-list-form" onSubmit={submit} className="grid gap-x-3 sm:grid-cols-2">
            <Field label="שם פרטי *" htmlFor="ml-first-name">
              <Input id="ml-first-name" name="firstName" autoComplete="given-name" required />
            </Field>

            <Field label="שם משפחה *" htmlFor="ml-last-name">
              <Input id="ml-last-name" name="lastName" autoComplete="family-name" required />
            </Field>

            <Field label="אימייל *" htmlFor="ml-email" className="sm:col-span-2">
              <Input
                id="ml-email"
                name="email"
                type="email"
                dir="ltr"
                className="text-right"
                autoComplete="email"
                required
              />
            </Field>

            <Field label="טלפון" htmlFor="ml-phone" className="sm:col-span-2">
              <Input
                id="ml-phone"
                name="phone"
                type="tel"
                dir="ltr"
                className="text-right"
                autoComplete="tel"
              />
            </Field>

            {error ? <p className="text-[13px] text-destructive sm:col-span-2">{error}</p> : null}
          </form>
        </DialogBody>

        <DialogFooter className="rounded-b-3xl border-border bg-secondary/40">
          <Button variant="pill-quiet" onClick={() => onDecide(false)} disabled={busy}>
            לא תודה
          </Button>
          <Button variant="pill" type="submit" form="mailing-list-form" loading={busy} className="shine-cta">
            <Mail className="size-4" />
            עדכנו אותי
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

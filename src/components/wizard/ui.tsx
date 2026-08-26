"use client";

import * as React from "react";
import { Check } from "lucide-react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

/* ===============================================================
   פריימיטיבים חזותיים מקומיים לאשף ההזמנה בלבד.

   פורטו משפת העיצוב של Base44 ReservationModal.jsx (StepDot,
   Field/Input בטוקנים card/border/primary/muted-foreground) —
   אבל בכוונה *לא* נכתבו כדריסה של src/components/ui/primitives.tsx
   המשותף: הקובץ הזה מוזרק גם ללוח הניהול (AdminShell, SlotsTab,
   CitiesTab...), ואסור לשנות שם ברירת מחדל בתור "כרום" לאשף.

   הרכיבים כאן משוכפלים במתכוון (Field/Input/Label) כדי שהעדכון
   הוויזואלי יישאר מבודד לגמרי לאשף ולא ידלוף ללוח הניהול או
   לפופאפים אחרים באתר שעדיין לא עברו רה-סקין.
   =============================================================== */

/** נקודת שלב במסלול העליון של האשף — "בוצע" מלא, "פעיל" כהה, "עתידי" מושתק */
export function StepDot({
  state,
  n,
}: {
  state: "done" | "active" | "todo";
  n: number;
}) {
  return (
    <span
      className={cn(
        "tnum grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
        "transition-[background-color,transform] duration-200 ease-smooth",
        state === "done" && "bg-primary text-primary-foreground",
        state === "active" && "bg-foreground text-background",
        state === "todo" && "bg-muted text-muted-foreground",
      )}
    >
      {state === "done" ? <Check className="size-3" strokeWidth={3} /> : n}
    </span>
  );
}

export const WLabel = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "mb-1.5 block text-xs font-semibold text-muted-foreground",
      className,
    )}
    {...props}
  />
));
WLabel.displayName = "WLabel";

const wFieldStyles = [
  "w-full bg-background text-foreground placeholder:text-muted-foreground",
  "rounded-xl border border-border px-4 py-2.5 text-sm",
  "transition-colors duration-200 ease-smooth",
  "focus:outline-none focus:border-primary",
  "disabled:opacity-55 disabled:cursor-not-allowed",
  "aria-[invalid=true]:border-destructive",
].join(" ");

export const WInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(wFieldStyles, className)} {...props} />
));
WInput.displayName = "WInput";

export const WTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(wFieldStyles, "min-h-24 resize-y leading-relaxed", className)}
    {...props}
  />
));
WTextarea.displayName = "WTextarea";

export function WField({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4", className)}>
      <WLabel htmlFor={htmlFor}>{label}</WLabel>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** כרטיס-שלב — מסגרת ה-"נייר" האחידה סביב תוכן כל שלב באשף */
export function WCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 soft-shadow sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

const wBadgeTones = {
  primary: "bg-secondary text-primary",
  neutral: "bg-muted text-foreground/70",
  success: "bg-primary text-primary-foreground",
  warn: "bg-[color-mix(in_srgb,var(--color-warn)_16%,transparent)] text-warn",
} as const;

export function WBadge({
  tone = "primary",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof wBadgeTones;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none",
        wBadgeTones[tone],
        className,
      )}
      {...props}
    />
  );
}

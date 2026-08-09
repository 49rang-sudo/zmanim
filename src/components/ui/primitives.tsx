"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------
   כרטיס
   --------------------------------------------------------------- */

export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "bg-surface border border-line rounded-lg shadow-e1",
        "transition-[transform,box-shadow,border-color] duration-200 ease-smooth",
        interactive &&
          "cursor-pointer hover:-translate-y-1 hover:shadow-e3 hover:border-accent",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-3", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xl font-semibold text-ink", className)}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

/* ---------------------------------------------------------------
   תווית, שדה קלט, אזור טקסט
   --------------------------------------------------------------- */

export const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "block text-[13px] font-medium text-ink-2 mb-1.5",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

const fieldStyles = [
  "w-full bg-surface text-ink placeholder:text-muted",
  "border border-line rounded-md px-3.5 py-2.5 text-sm",
  "transition-[border-color,box-shadow] duration-200 ease-smooth",
  "focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]",
  "disabled:opacity-55 disabled:cursor-not-allowed",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-danger)_18%,transparent)]",
].join(" ");

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldStyles, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldStyles, "min-h-24 resize-y leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Field({
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
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------
   תגית
   --------------------------------------------------------------- */

const badgeTones = {
  accent: "bg-accent-soft text-accent-strong",
  neutral: "bg-surface-3 text-ink-2",
  success: "bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)] text-success",
  warn: "bg-[color-mix(in_srgb,var(--color-warn)_16%,transparent)] text-warn",
  danger: "bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)] text-danger",
} as const;

export function Badge({
  tone = "accent",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof badgeTones;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-[11.5px] font-semibold leading-none",
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------
   כותרת-על קטנה
   --------------------------------------------------------------- */

export function Eyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------
   מצב ריק
   --------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon ? (
        <div className="mb-4 grid size-14 place-items-center rounded-full bg-surface-3 text-muted">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {body ? (
        <p className="mt-1.5 max-w-sm text-sm text-ink-2">{body}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

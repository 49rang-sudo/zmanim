"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-bold cursor-pointer select-none",
    "transition-[background-color,color,border-color] duration-200 ease-smooth",
    "disabled:pointer-events-none disabled:opacity-45 disabled:cursor-not-allowed",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-ink text-canvas hover:bg-accent hover:text-white",
        ghost:
          "bg-transparent text-ink border border-line-2 hover:bg-surface-2",
        subtle:
          "bg-surface text-ink border border-line hover:border-line-2 hover:bg-surface-2",
        quiet:
          "bg-transparent text-ink-2 hover:bg-surface-3 hover:text-ink",
        danger: "bg-danger text-white hover:brightness-110",
        /** כדור מלא בגוון primary — שפת העיצוב של Base44 (ReservationModal),
         * לשימוש באשף ההזמנה בלבד. אינו ברירת מחדל, ולכן לא נוגע בלוח
         * הניהול שממשיך להשתמש ב-primary/ghost/subtle/quiet כרגיל. */
        pill: "rounded-full bg-primary text-primary-foreground hover:brightness-105",
        /** כדור שקוף — לכפתורי "חזרה"/ביטול בתוך אותה שפת עיצוב */
        "pill-quiet":
          "rounded-full bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
        /** בורדר עדין + פינות rounded-xl — כפתור משני/סינון בשפת בייס44
         * (EditionsSection.jsx: "h-10 px-3 rounded-xl border border-border
         * bg-background ... hover:border-primary/60"). תוסף עבור restyle
         * לוח הניהול בלבד (בקשת בעלת האתר: "האדמין לא תואם לאדמין שיצרתי
         * בבייס44") — וריאנט חדש לגמרי, לא נוגע ב-primary/ghost/subtle/quiet
         * הקיימים שממשיכים לשרת צרכנים אחרים (אשף/נחיתה/קבלות) ללא שינוי. */
        soft: "rounded-xl border border-border bg-background text-foreground hover:border-primary/60 transition-colors",
      },
      size: {
        sm: "text-[13px] px-3.5 py-2",
        md: "text-sm px-5 py-2.5",
        lg: "text-base px-7 py-3.5",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <span
              className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden
            />
            <span>רגע…</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);

Button.displayName = "Button";
export { buttonVariants };

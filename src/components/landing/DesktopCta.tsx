"use client";

import * as React from "react";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { OrderCta } from "./OrderCta";
import type { SiteContentData } from "@/lib/content";

/* ===============================================================
   CTA צף בדסקטופ — פורט מ-DesktopCta.jsx. מופיע רק אחרי גלילה
   מעבר לגובה מסך אחד, כדי לא להתחרות בכפתורי ההירו. במובייל כבר
   יש MobileCtaBar (SiteHeader.tsx, מוסתר ב-sm:hidden) — זה תוסף
   ל-lg ומעלה, לא מחליף שום דבר קיים.

   בלי framer-motion (לא תלות קיימת באתר האמיתי): הכניסה/יציאה
   מוצגת ברינדור מותנה בלבד + אנימציית fade-up ב-CSS שכבר קיימת
   ב-globals.css ומשמשת את כל שלבי האשף (ראו animate-[fade-up_...]
   ב-OrderWizard.tsx) — לא מומצא מנגנון חדש.

   כפתור ההזמנה הוא <OrderCta href="#order"> הקיים, בדיוק כמו כל
   כפתור הזמנה אחר בעמוד — כולל התיאום עם "הזמנה בתהליך"
   (src/lib/order-focus.ts). הטקסט על הכפתור הוא content.landing.nav.cta,
   אותו קופי בדיוק שכבר מופיע על כפתור ההזמנה בסרגל העליון.
   =============================================================== */
export function DesktopCta({ content }: { content: SiteContentData }) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 hidden animate-[fade-up_0.25s_var(--ease-out-soft)_both] items-center gap-3 lg:flex">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="חזרה לראש הדף"
        className="hover-lift flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card soft-shadow transition-colors hover:border-primary"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
      <OrderCta
        href="#order"
        className="hover-lift inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground shadow-sm transition hover:brightness-105"
      >
        {content.landing.nav.cta}
        <ArrowLeft className="h-4 w-4" />
      </OrderCta>
    </div>
  );
}

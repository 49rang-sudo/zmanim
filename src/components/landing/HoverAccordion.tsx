"use client";

import * as React from "react";

/* ===============================================================
   רכיב לשימוש חוזר — פורט מ-
   zmanim2-base44/src/components/zmanim/HoverAccordion.jsx: פס לבן
   מעוגל עם N עמודות. ב-hover על עמודה — היא מתרחבת (flex-grow גדול
   יותר), שאר העמודות מתעמעמות (opacity). נייד: נערם אנכית. שולחן
   עבודה: שורה אופקית (RTL, כמו שאר האתר).

   בלי framer-motion (לא תלות קיימת באתר האמיתי): flexGrow/opacity
   עוברים דרך style inline, עם מעבר native ב-CSS על flex-grow/opacity
   (transition-[flex-grow,opacity]) — לא צריך ספריית אנימציה בשביל
   זה, דפדפנים מודרניים מאנימים flex-grow/opacity בול כמו כל מאפיין
   אחר.
   =============================================================== */

export type HoverAccordionItem = {
  title: string;
  body: string;
  /** מספר מוצג — ברירת מחדל 01, 02... לפי סדר items */
  number?: string;
};

export function HoverAccordion({
  items,
  className = "",
}: {
  items: HoverAccordionItem[];
  className?: string;
}) {
  const [active, setActive] = React.useState<number | null>(null);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-3xl border border-border bg-card soft-shadow sm:flex-row ${className}`}
      onMouseLeave={() => setActive(null)}
    >
      {items.map((item, index) => {
        const isActive = active === index;
        const isDimmed = active !== null && !isActive;
        return (
          <div
            key={index}
            onMouseEnter={() => setActive(index)}
            style={{
              flexGrow: isActive ? 2.8 : 1,
              flexBasis: 0,
              minWidth: 0,
              opacity: isDimmed ? 0.4 : 1,
            }}
            className="group cursor-default border-b border-border p-6 transition-[flex-grow,opacity] duration-500 ease-[var(--ease-out-soft)] last:border-b-0 hover:bg-secondary/40 sm:border-b-0 sm:border-r sm:first:border-r-0 lg:p-7"
          >
            <span className="font-mono-nums mb-4 block origin-right text-5xl font-bold leading-none text-primary transition-transform duration-300 group-hover:scale-110 lg:text-6xl">
              {item.number ?? String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mb-2 font-heading text-base font-bold leading-tight text-foreground lg:text-lg">
              {item.title}
            </h3>
            <p className="text-base leading-[1.6] text-muted-foreground-strong">{item.body}</p>
          </div>
        );
      })}
    </div>
  );
}

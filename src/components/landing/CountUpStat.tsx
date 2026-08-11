"use client";

import * as React from "react";

/**
 * סופר מ-0 עד הערך הסופי כשהקומפוננטה עולה לראשונה — "שנכנסים
 * לדף", לא בגלילה. מכבד prefers-reduced-motion (קופץ ישר לערך
 * הסופי). אם הערך אינו מספרי טהור (אחרי הסרת פסיקים) מוצג כמו
 * שהוא, בלי אנימציה — כדי לא לשבור ערכים כמו "A4".
 */
export function CountUpStat({ value }: { value: string }) {
  const target = Number(value.replace(/,/g, ""));
  const isNumeric = Number.isFinite(target) && value.trim() !== "";
  const [display, setDisplay] = React.useState(isNumeric ? "0" : value);

  React.useEffect(() => {
    if (!isNumeric) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(target.toLocaleString("en-US"));
      return;
    }

    const duration = 1400;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // ease-out-cubic — מתחיל מהר, נוחת רך על הערך הסופי
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(eased * target).toLocaleString("en-US"));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, isNumeric]);

  return <span className="tnum">{display}</span>;
}

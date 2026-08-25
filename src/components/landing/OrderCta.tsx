"use client";

import * as React from "react";
import {
  announceOrderIntent,
  ORDER_SECTION_ID,
  resolveCtaTarget,
  scrollToSection,
} from "@/lib/order-focus";
import type { PresenceTier } from "@/lib/packages";

type Props = {
  /**
   * היעד שהקופי של הכפתור מבטיח: "#order" לכפתור שאומר *לבחור*,
   * "#months" לכפתור שאומר *לראות/לצפות/לבדוק*. כשיש הזמנה
   * בתהליך היעד הזה נדרס ל-#order — ראו src/lib/order-focus.ts.
   */
  href: `#${string}`;
  /** דרגה שהכפתור מבטיח במפורש ("לבחירת חודש ונוכחות עוגן") */
  tier?: PresenceTier;
  className?: string;
  children: React.ReactNode;
};

/**
 * כפתור ההזמנה של עמוד הנחיתה. נשאר `<a href>` אמיתי — כך הוא
 * עובד גם בלי JS, נפתח בלשונית חדשה בלחיצה אמצעית, ומופיע לגוגל
 * כקישור פנימי. מה שנוסף כאן הוא רק *לאן* הלחיצה גוללת בפועל.
 *
 * שני דברים שהמטפל עושה ושקישור עוגן רגיל לא יודע לעשות:
 *
 *  · הזמנה בתהליך גוברת על היעד הכתוב, כדי שלחיצה לא תזרוק
 *    לקוחה מאמצע ההזמנה שלה כלפי מעלה, אל האזור השיווקי.
 *  · כפתור שמבטיח דרגה ("נוכחות עוגן") מודיע עליה לאשף, כדי
 *    שמה שנוחת יהיה מה שהובטח ולא מסך גנרי.
 */
export function OrderCta({ href, tier, className, children }: Props) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // לחיצה עם מקש מצרף / כפתור אמצעי = פתיחה בלשונית — לא נוגעים
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target = resolveCtaTarget(href.slice(1));
    event.preventDefault();

    if (scrollToSection(target)) {
      if (target === ORDER_SECTION_ID) announceOrderIntent(tier ?? null);
      return;
    }

    // אין אזור כזה בעמוד הנוכחי — הסרגל העליון מוצג גם ב-/receipts
    // וב-/order/[reference], ושם קישור עוגן פשוט לא עושה כלום.
    // כפתור שלא עושה כלום הוא בדיוק התלונה, אז נוסעים לעמוד הבית
    // אל האזור הנכון.
    window.location.href = `/#${target}`;
  };

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}

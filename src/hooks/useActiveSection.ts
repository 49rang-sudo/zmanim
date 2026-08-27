"use client";

import { useEffect, useState } from "react";

/* ===============================================================
   Scroll-spy: מחזיר את ה-id של הסקשן שנמצא כרגע באזור העליון של
   המסך, כדי להדגיש את הקישור המתאים בניווט. IntersectionObserver
   עם rootMargin שמצמצם את "אזור ההתעניינות" לרצועה מתחת לסרגל
   הניווט. פורט כמעט-מילולי מ-
   zmanim2-base44/src/hooks/useActiveSection.js (הוק טהור, בלי
   קריאות ל-Base44 SDK) — רק הקלדה ל-TypeScript.
   =============================================================== */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState("");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -55% 0px", threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- מכוון: תלות ב-ids.join(",") ולא במערך עצמו, כמו במקור
  }, [ids.join(",")]);

  return active;
}

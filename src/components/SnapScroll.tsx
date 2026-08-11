"use client";

import * as React from "react";

const LOCK_MS = 650;
const HEADER_OFFSET = 64;

/**
 * גלילת עכבר → קפיצה מלאה לסקשן הבא/קודם, גם על החלקה הכי
 * קטנה. בקשת לקוחה מפורשת — scroll-snap CSS לבד רק "מתיישב"
 * ליד הסקשן הקרוב, לא באמת מגיב לכל טיק גלגלת.
 */
export function SnapScroll() {
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let locked = false;

    const getSections = () =>
      Array.from(document.querySelectorAll<HTMLElement>(".snap-section"));

    const onWheel = (event: WheelEvent) => {
      if (locked || Math.abs(event.deltaY) < 2) return;

      const sections = getSections();
      if (sections.length === 0) return;

      const current = sections.reduce((closest, section) => {
        const top = Math.abs(section.getBoundingClientRect().top);
        const closestTop = Math.abs(closest.getBoundingClientRect().top);
        return top < closestTop ? section : closest;
      });

      const index = sections.indexOf(current);
      const nextIndex = event.deltaY > 0 ? index + 1 : index - 1;
      const target = sections[nextIndex];
      if (!target) return; // בקצה — משאירים גלילה חופשית רגילה

      event.preventDefault();
      locked = true;

      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });

      window.setTimeout(() => {
        locked = false;
      }, LOCK_MS);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  return null;
}

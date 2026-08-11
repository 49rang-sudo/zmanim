/**
 * דרגות פריסט להתחייבות מרובת-מהדורות (חודשים). אלו רק תוויות
 * שיווקיות שמסמנות "כמה מהדורות לסמן מראש" בצ'קליסט הבחירה באשף
 * — הבחירה בפועל היא צ'קבוקסים חופשיים על מהדורות אמיתיות
 * (ראו Edition ב-schema.prisma ו-src/lib/availability.ts),
 * לא מחיר/כמות קבועים לדרגה.
 */
export const AD_PACKAGES = [
  { id: "SINGLE", label: "פרסום חד־פעמי", editions: 1, discount: 0 },
  { id: "SILVER_PLUS", label: "סילבר+", editions: 2, discount: 0.05 },
  { id: "SILVER", label: "סילבר", editions: 3, discount: 0.05 },
  { id: "GOLD", label: "זהב", editions: 5, discount: 0.05 },
  { id: "PLATINUM", label: "פלטינום", editions: 6, discount: 0.05 },
] as const;

export type PackageId = (typeof AD_PACKAGES)[number]["id"];

export function getPackage(id: string) {
  return AD_PACKAGES.find((p) => p.id === id);
}

/** מחיר כולל על פני N מהדורות, באגורות — מעוגל לאגורה השלמה. 5% הנחה קבועה מעל מהדורה אחת. */
export function packageTotalAgorotForEditions(
  unitPriceAgorot: number,
  editionsCount: number,
): number {
  const discount = editionsCount > 1 ? 0.05 : 0;
  return Math.round(unitPriceAgorot * editionsCount * (1 - discount));
}

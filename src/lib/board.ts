/**
 * כלל בחירת סצנת הקונספט של חודש — פונקציה טהורה, בלי prisma.
 *
 * היא יושבת בקובץ נפרד מ-src/lib/site.ts *בכוונה*: site.ts מייבא
 * את לקוח מסד הנתונים, ובורר החלונות הוא רכיב לקוח. ייבוא ערך (לא
 * טיפוס) מ-site.ts היה גורר את prisma לחבילת הדפדפן.
 *
 * שני הצדדים חייבים להשתמש כאן באותו כלל בדיוק:
 *  · השרת — ספירת המלאי לכל מהדורה (src/lib/availability.ts).
 *  · הלקוח — מה שמוצג בפועל בדפדוף החודשים (CalendarMockup).
 * אם הם ייפרדו, המספר "3 מקומות פנויים" יתאר סצנה אחרת מזו שעל
 * המסך.
 */

/**
 * הסצנות שרלוונטיות לחודש לועזי מסוים.
 *
 * קודם כל הסצנות שהחודש שלהן תואם למהדורה. רק אם לחודש הזה עדיין
 * אין אמנות ייעודית — נופלים לסצנות הכלליות (gregorianMonth = null).
 * כך המערכת מוכרת כרגיל גם לפני שהמעצבת סיפקה את כל 12 הסצנות.
 */
export function boardForMonth<T extends { gregorianMonth: number | null }>(
  board: T[],
  gregorianMonth: number | null | undefined,
): T[] {
  if (gregorianMonth != null) {
    const exact = board.filter(
      (image) => image.gregorianMonth === gregorianMonth,
    );
    if (exact.length > 0) return exact;
  }
  return board.filter((image) => image.gregorianMonth === null);
}

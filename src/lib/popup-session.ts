/* ===============================================================
   נעילת פופאפים — חלונית אחת לכל ביקור, לא יותר.

   באתר יש שתי חלוניות שקופצות מעצמן: פופאפ "בדקו לי מקום"
   (סעיף 16 בקופי) והצטרפות לרשימת התפוצה שבאשף ההזמנה. שתיהן
   מזוינות באותה כוונת-יציאה, ובלי תיאום ביניהן מבקר אחד היה
   מקבל שתי חלוניות ברצף. זה לא "עוד ליד" — זה סיבה לסגור לשונית.

   הכלל: הראשונה שמספיקה לקפוץ תופסת את הביקור.

   sessionStorage ולא localStorage: הדחייה שייכת לביקור הזה.
   מי שחוזר מחר הוא מבקר חדש שראוי להצעה, ומי שסגר לפני חמש
   דקות לא רוצה לראות אותה שוב עכשיו. חריג אחד — מי שכבר *שלח*
   פנייה נשמר ב-localStorage: אין שום סיבה לבקש ממנו שוב בעוד
   שבוע את מה שכבר מסר.

   כל גישה עטופה ב-try/catch: בגלישה פרטית חלק מהדפדפנים זורקים
   חריגה על עצם הגישה לאחסון, וחלונית שיווקית לא תפיל דף.
   =============================================================== */

const SESSION_KEY = "zmanim:popup-shown";
const SUBMITTED_KEY = "zmanim:inquiry-submitted";

export function popupAlreadyShown(): boolean {
  try {
    if (window.localStorage.getItem(SUBMITTED_KEY)) return true;
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    // אין גישה לאחסון — עדיף לא להקפיץ מאשר להקפיץ בכל גלילה
    return true;
  }
}

export function markPopupShown(): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // אין אחסון: החלונית פשוט תוכל לקפוץ שוב בטעינה הבאה
  }
}

/** מי שכבר שלח פנייה לא יתבקש שוב — גם לא בביקור הבא */
export function markInquirySubmitted(): void {
  try {
    window.localStorage.setItem(SUBMITTED_KEY, "1");
  } catch {
    // ראו למעלה
  }
  markPopupShown();
}

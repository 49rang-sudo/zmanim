import { z } from "zod";

// אין ייבוא node:* — הקובץ נטען גם בלקוח

export const contentSchema = z.object({
  brand: z.object({
    siteName: z.string().min(1),
    tagline: z.string(),
    logoUrl: z.string().optional().nullable(),
  }),

  hero: z.object({
    eyebrow: z.string(),
    title: z.string().min(1),
    subtitle: z.string(),
    primaryCta: z.string().min(1),
    secondaryCta: z.string(),
    stats: z.array(z.object({ value: z.string(), label: z.string() })).max(4),
  }),

  highlights: z
    .array(
      z.object({
        icon: z.string(),
        title: z.string(),
        text: z.string(),
      }),
    )
    .max(6),

  howItWorks: z
    .array(z.object({ title: z.string(), text: z.string() }))
    .max(6),

  faq: z.object({
    items: z
      .array(z.object({ question: z.string(), answer: z.string() }))
      .max(12),
  }),

  /** כותרות לוח השנה שמוצג בתחתית המוקאפ */
  calendar: z.object({
    monthLabel: z.string(),
    yearLabel: z.string(),
    /** חודש לועזי לרינדור הרשת: 1-12 */
    gregorianMonth: z.number().int().min(1).max(12),
    gregorianYear: z.number().int().min(2020).max(2100),
    footnote: z.string(),
  }),

  wizard: z.object({
    chooseTitle: z.string(),
    chooseSubtitle: z.string(),
    cityTitle: z.string(),
    citySubtitle: z.string(),
    detailsTitle: z.string(),
    detailsSubtitle: z.string(),
    uploadTitle: z.string(),
    uploadSubtitle: z.string(),
    payTitle: z.string(),
    paySubtitle: z.string(),
    cityFullMessage: z.string(),
    slotTakenMessage: z.string(),
    successTitle: z.string(),
    successBody: z.string(),
  }),

  tos: z.object({
    title: z.string(),
    intro: z.string(),
    sections: z.array(z.object({ heading: z.string(), body: z.string() })),
    acceptLabel: z.string(),
  }),

  contact: z.object({
    phone: z.string(),
    email: z.string(),
    whatsapp: z.string().optional().nullable(),
  }),

  footer: z.object({
    note: z.string(),
  }),
});

export type SiteContentData = z.infer<typeof contentSchema>;

export const defaultContent: SiteContentData = {
  brand: {
    siteName: "ZMANIM",
    tagline: "הפרסום של העסק שלך בזמן הנכון",
    logoUrl: null,
  },

  hero: {
    eyebrow: "בני ברק · מהדורת תשפ״ז",
    title: "המודעה שלכם. על הקיר שלהם. כל השנה.",
    subtitle:
      "בלי להילחם על פתיחת העיתון ובלי להיזרק לפח במוצאי שבת. לוח השנה של בני ברק מגיע ל-30,000 בתים בדיוור ישיר — ותופס את המקום הכי בולט בבית למשך 365 יום.",
    primaryCta: "לתפוס משבצת בלוח ←",
    secondaryCta: "איך זה עובד",
    stats: [
      {
        value: "30,000",
        label: "בתים בבני ברק בדיוור ישיר עד הדלת (כרומו מבריק, A4 מקופל ל־A5)",
      },
      { value: "365", label: "ימים של חשיפה רצופה מול עיני המשפחה" },
    ],
  },

  highlights: [
    {
      icon: "calendar",
      title: "אפס בלאי, מקסימום נוכחות",
      text: "עיתון נזרק בסוף השבוע. לוח השנה נשאר תלוי במקום מרכזי בבית לאורך כל השנה.",
    },
    {
      icon: "calendar",
      title: "מול העיניים בכל יום מחדש",
      text: "נוכחות יומיומית קבועה במקום שבו מתקבלות ההחלטות הצרכניות של הבית.",
    },
    {
      icon: "map-pin",
      title: "כיסוי מלא בדיוור ישיר",
      text: "חלוקה יסודית דלת-לדלת בכל שכונות בני ברק. הפרסום שלכם מגיע לכל בית אב.",
    },
  ],

  howItWorks: [
    {
      title: "בחירת משבצת",
      text: "בוחרים את המיקום והגודל המבוקש על גבי הגריד.",
    },
    {
      title: "פרטי העסק",
      text: "מזינים פרטים קצרים ובוחרים עיר פרסום.",
    },
    {
      title: "העלאת קובץ",
      text: "מעלים את המודעה המוכנה לדפוס בלחיצה אחת.",
    },
    {
      title: "סגירה וסליקה",
      text: "משלמים במערכת מאובטחת והמקום שלכם שמור.",
    },
  ],

  faq: {
    items: [
      {
        question: "למה להשקיע בלוח שנה ולא בעיתון יומי/שבועי?",
        answer:
          "עיתון מסיים את תפקידו תוך יום-יומיים ועובר לפח. לוח שנה יוקרתי נשאר תלוי במקום מרכזי בבית — בסלון או במטבח — מעגל שנה שלם (365 ימים), ומעניק לעסק שלך חשיפה יומיומית רצופה מול כל המשפחה.",
      },
      {
        question: "איך אפשר לוודא שהלוחות באמת מגיעים לכל הבתים?",
        answer:
          "ההפצה מבוצעת בדיוור ישיר, דלת לדלת, על ידי צוות חלוקה ייעודי המכסה 30,000 בית אב בבני ברק. החלוקה מפוקחת ומבוקרת כדי להבטיח אחוז חשיפה מלא בכל שכונות העיר.",
      },
      {
        question: "עד מתי ניתן להעלות את קובץ הפרסום?",
        answer:
          "ניתן לשריין ולהבטיח את המשבצת בלוח כבר עכשיו, ואת קובץ ההדפסה הסופי להעלות עד תאריך סגירת המהדורה (יופיע במסך אישור ההזמנה).",
      },
      {
        question: "מה מרוויחים בהתחייבות למספר חודשים מראש?",
        answer:
          "שני יתרונות מרכזיים: רוכשים משבצת בודדת ומקבלים 5% הנחה קבועה על הסכום הכולל, ומבטיחים שמישהו אחר לא יתפוס את המיקום האסטרטגי שלכם בחודשים הבאים.",
      },
      {
        question: "באילו פורמטים ומידות צריך להעלות את המודעה?",
        answer:
          "המידות המדויקות מוצגות מיד עם הלחיצה על המשבצת שנבחרה. יש להעלות קובץ מוכן לדפוס בפורמט PDF או JPG באיכות גבוהה (300 DPI).",
      },
      {
        question: "האם תהליך התשלום מאובטח ומתקבלת חשבונית?",
        answer:
          "בהחלט. הסליקה מבוצעת בתקן האבטחה המחמיר ביותר (PCI-DSS), ומיד לאחר התשלום נשלחת חשבונית מס/קבלה מסודרת ואישור הזמנה ישירות למייל שלכם.",
      },
    ],
  },

  calendar: {
    monthLabel: "תשרי",
    yearLabel: "תשפ״ז",
    gregorianMonth: 9,
    gregorianYear: 2026,
    footnote: "כולל זמני היום המדויקים מבית עתים לבינה",
  },

  wizard: {
    chooseTitle: "בחרו את המשבצת שלכם",
    // נוסח נייטרלי למכשיר — "ריחוף" לא קיים במסך מגע
    chooseSubtitle:
      "בחרו אזור בעמוד כדי לראות מידות ומחיר. הבחירה פותחת את תנאי ההתקשרות.",
    cityTitle: "באיזו עיר לפרסם?",
    citySubtitle:
      "לכל עיר מהדורת דפוס נפרדת עם מלאי משבצות משלה. ערים מלאות מוצגות אפורות.",
    detailsTitle: "פרטי המפרסם",
    detailsSubtitle: "אלו הפרטים שאליהם נחזור בכל שאלה על ההזמנה.",
    uploadTitle: "העלאת קובץ להדפסה",
    uploadSubtitle:
      "PDF במידות המדויקות, 300dpi, עם 3 מ״מ בליד. אפשר גם JPG/PNG/TIFF באיכות גבוהה.",
    payTitle: "סיכום ותשלום",
    paySubtitle: "בדקו את הפרטים ועברו לתשלום מאובטח אצל ספק הסליקה.",
    cityFullMessage:
      "העיר הזו מלאה למהדורה הנוכחית. אפשר להשאיר פרטים ונעדכן כשמתפנה מקום.",
    slotTakenMessage:
      "המשבצת הזו כבר נתפסה בעיר שבחרתם. אפשר לבחור משבצת אחרת או עיר אחרת.",
    successTitle: "ההזמנה נקלטה",
    successBody:
      "קיבלנו את התשלום ואת הקובץ. אנחנו עוברים על החומר ונחזור אליכם עם הגהה לאישור.",
  },

  tos: {
    title: "תנאי התקשרות לפרסום בלוח",
    intro:
      "לפני בחירת המשבצת, אנא קראו את התנאים. אישור התנאים הוא תנאי להמשך ההזמנה.",
    sections: [
      {
        heading: "קובץ להדפסה",
        body: "באחריות המפרסם לספק קובץ במידות המדויקות של המשבצת, ברזולוציה 300dpi ובמרחב צבע CMYK, כולל 3 מ״מ בליד מכל צד. קבצים שאינם עומדים במפרט עלולים להידפס בפועל באיכות ירודה.",
      },
      {
        heading: "הגהה ואישור",
        body: "לאחר קליטת הקובץ תישלח אליכם הגהה דיגיטלית. אי-מתן מענה תוך 3 ימי עסקים ייחשב כאישור ההגהה כפי שהיא.",
      },
      {
        heading: "תפיסת מקום",
        body: "בחירת משבצת שומרת אותה עבורכם למשך זמן מוגבל בלבד. משבצת שלא שולמה בתוך פרק הזמן משתחררת אוטומטית למפרסמים אחרים.",
      },
      {
        heading: "תוכן המודעה",
        body: "המפרסם אחראי בלעדית לתוכן המודעה ולזכויות השימוש בו. מפורסמים בלוח רק עסקים שומרי שבת. שמורה לנו הזכות לסרב לפרסם תוכן שאינו הולם את אופי הלוח.",
      },
      {
        heading: "ביטולים",
        body: "ביטול אפשרי עד למועד סגירת המהדורה לדפוס. לאחר מסירת הקבצים לבית הדפוס לא ניתן לבטל או לזכות.",
      },
    ],
    acceptLabel: "קראתי, הבנתי ואני מאשר/ת את תנאי ההתקשרות",
  },

  contact: {
    phone: "03-0000000",
    email: "info@luach.local",
    whatsapp: null,
  },

  footer: {
    note: "לוח השנה הקהילתי — פרסום מקומי שמגיע לכל בית.",
  },
};

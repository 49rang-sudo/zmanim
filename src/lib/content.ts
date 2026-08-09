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
    title: "לא עוד פרסום חולף. נוכחות חזקה.",
    subtitle:
      "לוח שנה יוקרתי שמגיע לכל בית בבני ברק — 30,000 עותקים בדיוור ישיר, דלת לדלת. הפרסום שלכם נשאר על הקיר מעגל שנה שלם.",
    primaryCta: "לבחירת גודל פרסום",
    secondaryCta: "איך זה עובד",
    stats: [
      { value: "30,000", label: "עותקים בדיוור ישיר" },
      { value: "A4", label: "נייר כרומו מבריק, מקופל ל־A5" },
      { value: "12", label: "חודשי חשיפה רצופה" },
    ],
  },

  highlights: [
    {
      icon: "calendar",
      title: "לא עוד מודעה שנעלמת",
      text: "מודעה בעיתון נזרקת למחרת. לוח שנה נשאר בבית לאורך כל מעגל השנה.",
    },
    {
      icon: "calendar",
      title: "כל יום מול העיניים",
      text: "נוכחות יומיומית רצופה, במקום שבו מתקבלות ההחלטות של המשפחה.",
    },
    {
      icon: "map-pin",
      title: "הפצה מושלמת",
      text: "חלוקה ישירה לתיבות הדואר ולדלתות בבני ברק. בלי בזבוז על קהל שאינו שלכם.",
    },
  ],

  howItWorks: [
    {
      title: "בחירת גודל",
      text: "לוחצים על הגריד של הלוח ובוחרים את גודל המשבצת והמיקום.",
    },
    {
      title: "אימות פרטי העסק",
      text: "ממלאים את פרטי העסק ובוחרים את העיר שבה מפרסמים.",
    },
    {
      title: "העלאת הקובץ",
      text: "מעלים את קובץ הפרסום המוכן לדפוס, ישירות מהמחשב.",
    },
    {
      title: "תשלום וסגירה",
      text: "עוברים לסליקה מאובטחת וההזמנה נסגרת סופית.",
    },
  ],

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
        body: "המפרסם אחראי בלעדית לתוכן המודעה ולזכויות השימוש בו. שמורה לנו הזכות לסרב לפרסם תוכן שאינו הולם את אופי הלוח.",
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

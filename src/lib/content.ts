import { z } from "zod";

// אין ייבוא node:* — הקובץ נטען גם בלקוח

/* ===============================================================
   תוכן עמוד הנחיתה — הקופי המלא שהלקוחה מסרה (19 סעיפים).

   הכול חי כאן ולא בתוך הרכיבים, כי הרשומה היחידה SiteContent
   שומרת את האובייקט הזה כ-JSON ולוח הניהול (ContentTab) עורך אותו.
   מחרוזת שנכתבת בתוך רכיב היא מחרוזת שהלקוחה לא יכולה לשנות.

   ⚠ מספרים (מחירים, מלאי, תאריכים) *לא* נשמרים כאן. הם נגזרים
   בזמן ריצה מהנתונים האמיתיים — AdSlot.priceAgorot לכסף,
   EditionAvailability.tiers לזמינות, ולוח השנה העברי לתאריך
   הבונוס. טקסט שיווקי שמבטיח מספר הוא טקסט שמשקר ברגע שהמספר
   משתנה.
   =============================================================== */

const linkSchema = z.object({ label: z.string(), href: z.string() });

const landingSchema = z.object({
  /** 1 · תפריט עליון */
  nav: z.object({
    links: z.array(linkSchema).max(8),
    cta: z.string(),
    /** כפתור קבוע בתחתית מסך המובייל */
    mobileCta: z.string(),
  }),

  /** 2 · פס הנתונים מתחת למסך הראשון — ראו hero.stats */

  /** 3 · אז מה בעצם שונה כאן? */
  difference: z.object({
    eyebrow: z.string(),
    title: z.string(),
    subtitle: z.string(),
    /** שלוש דוגמאות "מתי זה רלוונטי" */
    examples: z.array(z.string()).max(6),
    paragraphs: z.array(z.string()).max(6),
  }),

  /** 4 · המחשה ויזואלית — הדמיות של חודשים שונים */
  showcase: z.object({
    title: z.string(),
    subtitle: z.string(),
    items: z
      .array(
        z.object({
          /** ריק = נלקח מהמהדורה האמיתית שבאותו מיקום */
          monthLabel: z.string(),
          /** ריק = נלקח משם הסצנה האמיתית */
          conceptTitle: z.string(),
          text: z.string(),
        }),
      )
      .max(6),
    closing: z.string(),
  }),

  /** 5 · בחירת חודש — האזור המרכזי באתר */
  months: z.object({
    eyebrow: z.string(),
    title: z.string(),
    subtitle: z.string(),
    hint: z.string(),
    filterLabel: z.string(),
    filterPlaceholder: z.string(),
    suitableForLabel: z.string(),
    presenceLabel: z.string(),
    priceFromLabel: z.string(),
    cta: z.string(),
    microcopy: z.string(),
    /** כשהתחום שחיפשו כבר נתפס בחודש מסוים */
    takenTitle: z.string(),
    takenBody: z.string(),
    takenCta: z.string(),
    /**
     * העיר שהמהדורות שלה מוצגות בעמוד הנחיתה. ריק (או שם שלא קיים)
     * = העיר הגלויה הראשונה שיש לה מהדורה פתוחה.
     */
    cityName: z.string(),
    emptyState: z.string(),
  }),

  /** 6 · למה זה לא עוד מקום פרסום — ארבע הנקודות ב-highlights */
  whyNotAnother: z.object({
    eyebrow: z.string(),
    title: z.string(),
  }),

  /** 7 · מה מקבלים בפועל? */
  whatYouGet: z.object({
    eyebrow: z.string(),
    title: z.string(),
    items: z.array(z.string()).max(12),
    bringTitle: z.string(),
    bringText: z.string(),
    bringNote: z.string(),
  }),

  /** 8 · מחיר ואפשרויות נוכחות */
  pricing: z.object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    priceLabel: z.string(),
    anchor: z.object({
      name: z.string(),
      text: z.string(),
      includes: z.string(),
      cta: z.string(),
    }),
    complementary: z.object({
      name: z.string(),
      text: z.string(),
      includes: z.string(),
      cta: z.string(),
    }),
    bothNote: z.string(),
    multi: z.object({
      title: z.string(),
      text: z.string(),
      tableTitle: z.string(),
      anchorTitle: z.string(),
      anchorRows: z.array(z.string()).max(8),
      complementaryTitle: z.string(),
      complementaryRows: z.array(z.string()).max(8),
      cta: z.string(),
    }),
    microcopy: z.string(),
  }),

  /** 9 · ההטבה שעובדת לשני הצדדים */
  benefit: z.object({
    eyebrow: z.string(),
    title: z.string(),
    body: z.array(z.string()).max(6),
  }),

  /** 10 · איך מצטרפים? — חמשת הצעדים ב-howItWorks */
  howToJoin: z.object({
    eyebrow: z.string(),
    title: z.string(),
    cta: z.string(),
    microcopy: z.string(),
  }),

  /** 11 · בונוס למצטרפים הראשונים — נעלם אוטומטית אחרי המועד */
  earlyBird: z.object({
    eyebrow: z.string(),
    title: z.string(),
    body: z.string(),
    cta: z.string(),
    /** התאריך העברי של סוף ההטבה — מתורגם ללועזי בזמן רינדור */
    deadlineLabel: z.string(),
    deadlineHebrewDay: z.number().int().min(1).max(30),
    deadlineHebrewMonth: z.string(),
    /**
     * השנה העברית של המועד. מקובעת בכוונה ולא "השנה הנוכחית":
     * הטבת השקה שנגמרה צריכה להיעלם לתמיד, לא לחזור מעצמה בכל
     * אלול. 0 = השנה העברית הנוכחית (התנהגות מתגלגלת, למי שירצה
     * הטבה שנתית חוזרת). ראו resolveHebrewDeadline.
     */
    deadlineHebrewYear: z.number().int().min(0).max(6000).default(5786),
  }),

  /** 12 · מי עומד מאחורי "זמנים"? */
  about: z.object({
    eyebrow: z.string(),
    title: z.string(),
    body: z.array(z.string()).max(8),
  }),

  /** 13 · שאלות — הפריטים עצמם ב-faq.items */
  faq: z.object({
    eyebrow: z.string(),
    title: z.string(),
  }),

  /** 14 · הנעה סופית */
  finalCta: z.object({
    title: z.string(),
    subtitle: z.string(),
    body: z.string(),
    ask: z.string(),
    primaryCta: z.string(),
    secondaryCta: z.string(),
  }),

  /** 15 · טופס פנייה */
  inquiry: z.object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    businessNameLabel: z.string(),
    businessNamePlaceholder: z.string(),
    categoryLabel: z.string(),
    categoryPlaceholder: z.string(),
    locationLabel: z.string(),
    contactNameLabel: z.string(),
    phoneLabel: z.string(),
    emailLabel: z.string(),
    monthGuessLabel: z.string(),
    noteLabel: z.string(),
    optionalHint: z.string(),
    submitLabel: z.string(),
    microcopy: z.string(),
    privacyNote: z.string(),
  }),

  /** 16 · פופאפ */
  popup: z.object({
    title: z.string(),
    body: z.string(),
    categoryLabel: z.string(),
    categoryPlaceholder: z.string(),
    contactLabel: z.string(),
    contactPlaceholder: z.string(),
    submitLabel: z.string(),
    dismissLabel: z.string(),
  }),

  /** 17 · מיקרו קופי לסטטוסים */
  status: z.object({
    available: z.string(),
    fillingUp: z.string(),
    lastSpot: z.string(),
    taken: z.string(),
    inquiryReceived: z.string(),
    fitApproved: z.string(),
    beforePayment: z.string(),
    afterPayment: z.string(),
    wrongCategory: z.string(),
  }),

  /** 18 · פוטר */
  footer: z.object({
    tagline: z.string(),
    links: z.array(linkSchema).max(6),
    tosLabel: z.string(),
    privacyLabel: z.string(),
    /** ריק = הקישור לא מוצג כלל (עדיף מקישור שבור) */
    privacyHref: z.string(),
  }),

  /** 19 · כותרת דפדפן ותיאור לגוגל */
  seo: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export type LandingContent = z.infer<typeof landingSchema>;

/* ---------------------------------------------------------------
   ברירת המחדל — הקופי של הלקוחה, מילה במילה.
   --------------------------------------------------------------- */

export const defaultLanding: LandingContent = {
  nav: {
    links: [
      { label: "איך זה עובד", href: "#how" },
      { label: "החודשים", href: "#months" },
      { label: "מה מקבלים", href: "#what-you-get" },
      { label: "מחירים", href: "#pricing" },
      { label: "שאלות", href: "#faq" },
      { label: "יצירת קשר", href: "#contact" },
    ],
    cta: "בחירת חודש ומקום",
    mobileCta: "בחירת חודש ומקום",
  },

  difference: {
    eyebrow: "אז מה בעצם שונה כאן?",
    title: "פרסום טוב לא רק רואים",
    subtitle: "הוא צריך לפגוש את הלקוחות בזמן הנכון",
    examples: [
      "כשמשפחה חושבת על חידוש הבית- ריהוט, תאורה ועיצוב מרגישים פתאום רלוונטיים.",
      "כשמגיע זמן של לימודים- קורסים והכשרות נכנסים לתמונה באופן טבעי.",
      "ובתקופה של שמחות, חופשות, או קניות לחג - יש עסקים שפשוט שייכים לשם.",
    ],
    paragraphs: [
      `על הרעיון הזה בנוי "זמנים".`,
      "במקום למלא את הלוח בקוביות משעממות של פרסום, כל חודש מקבל סצנה משלו - בית, חדר, תקופה או עולם תוכן - והעסקים משתלבים בתוכה בצורה עדינה, ברורה ומדויקת.",
      `כך המשפחה מקבלת לוח שנעים להחזיק ולהשתמש בו,
והעסק מקבל נוכחות שלא מרגישה כמו עוד מודעה שמבקשת תשומת לב.`,
    ],
  },

  showcase: {
    title: "כל חודש נראה אחרת.",
    subtitle: "וגם העסק שלכם יכול להיראות בו אחרת.",
    items: [
      {
        monthLabel: "",
        conceptTitle: "סלון",
        text: "יכול לחבר באופן טבעי בין ריהוט, תאורה, אדריכלות, עיצוב, פרקטים, טקסטיל ועוד.",
      },
      {
        monthLabel: "",
        conceptTitle: "לימודים והתפתחות",
        text: "יכול לתת מקום לקורסים, הכשרות, ציוד, שירותים מקצועיים ומוצרים רלוונטיים לתקופה.",
      },
      {
        monthLabel: "חודש של שמחות",
        conceptTitle: "",
        text: "יכול להפגיש באותה סצנה עסקים ושירותים שהמשפחה ממילא מחפשת כשהאירוע מתקרב.",
      },
    ],
    closing: `אנחנו לא מחפשים איך "לדחוף" את העסק לתמונה.
אלא משלבים את העסק בתוך התמונה שאליה הוא כבר שייך.`,
  },

  months: {
    eyebrow: "בחירת חודש",
    title: "עכשיו נשאר למצוא את הזמן של העסק שלכם.",
    subtitle:
      "עברו בין החודשים והקונספטים, ראו אילו תחומים מתאימים לכל אחד ומה עדיין פנוי.",
    hint: `אם התחום שלכם לא מופיע ברשימה - אל תוותרו עליו.
אפשר לחשוב בצורה יותר יצירתית ולמצוא הקשר מעניין😊`,
    filterLabel: "מה העסק שלכם עושה?",
    filterPlaceholder: "הקלידו תחום ונראה איפה הוא יכול להשתלב",
    suitableForLabel: "מתאים בין היתר ל:",
    presenceLabel:
      "אפשרויות נוכחות: מפרסם עוגן / מפרסם משלים - לפי הזמינות באותו חודש.",
    priceFromLabel: "מחיר החל מ:",
    cta: "לבחירת מקום ורמת נוכחות",
    microcopy:
      "הזמינות מתעדכנת בהתאם לשריונים. לאחר בחירת החודש תוכלו לבחור בין נוכחות עוגן לנוכחות משלימה, לראות את המחיר ולהמשיך לשריון.",
    takenTitle: "התחום הזה כבר בפנים.",
    takenBody: "אבל יכול להיות שיש חודש נוסף שמתאים לכם.",
    takenCta: "בדקו לי אפשרות אחרת",
    cityName: "בני ברק",
    emptyState:
      "המהדורות של החודשים הקרובים נפתחות ממש עכשיו. השאירו פרטים ונעדכן אתכם ברגע שהחודשים ייפתחו.",
  },

  whyNotAnother: {
    eyebrow: "למה זה לא עוד מקום פרסום",
    title: `כי יש הבדל בין לקנות שטח פרסום
לבין לבחור איפה העסק שלכם פוגש את הלקוח.`,
  },

  whatYouGet: {
    eyebrow: "מה מקבלים בפועל?",
    title: "כל מה שצריך כדי להיכנס נכון ללוח.",
    items: [
      "שילוב העסק בתוך הקונספט של החודש שנבחר",
      "שם העסק או הלוגו",
      "מסר קצר ומדויק",
      "פרטי קשר",
      "אלמנט שמחבר את העסק לסצנה, בהתאם לקונספט",
      `אפשרות להטבה ייעודית למי שמגיע דרך "זמנים"`,
      "חשיפה במסגרת מהדורה המופצת ל-30,000 בתי אב בבני ברק",
    ],
    bringTitle: "ומה אתם מביאים?",
    bringText:
      "לוגו, כמה פרטים על העסק, דרך יצירת קשר והטבה שתרצו לתת.",
    bringNote: "אין צורך לעצב מודעה במיוחד בשביל הלוח.",
  },

  pricing: {
    eyebrow: "מחיר ואפשרויות נוכחות",
    title: "אותו חודש. שתי רמות נוכחות. בוחרים מה נכון לעסק שלכם.",
    intro:
      "אחרי שמצאתם את החודש שמתאים לעסק, בוחרים את רמת הנוכחות שמתאימה לכם. בשתי האפשרויות העסק משתלב בתוך הסצנה של אותו חודש - ההבדל הוא בכמה מקום ובמה הוא מקבל בתוך הקונספט.",
    priceLabel: "מחיר:",
    anchor: {
      name: "מפרסם עוגן",
      text: "נוכחות רחבה ומשמעותית יותר בתוך הקונספט. העסק מקבל מקום מרכזי יותר בסצנה ויכול להיות מחובר לאלמנט מרכזי או לכמה נקודות נוכחות טבעיות, בהתאם לעיצוב ולחודש.",
      includes: `כולל את כל מה שמופיע בסעיף "מה מקבלים בפועל", עם במה רחבה ובולטת יותר בתוך הסצנה.`,
      cta: "לבחירת חודש ונוכחות עוגן",
    },
    complementary: {
      name: "מפרסם משלים",
      text: `נוכחות ממוקדת יותר בתוך הקונספט, סביב מוצר, שירות או נקודה טבעית בסצנה. זו לא "מודעה קטנה", אלא במה מדויקת יותר לעסק שרוצה להיות נוכח במקום הנכון בלי לתפוס את מרכז התמונה.`,
      includes: "",
      cta: "לבחירת חודש ונוכחות משלימה",
    },
    bothNote:
      "בשתי רמות הנוכחות הפרסום נשאר בתוך תמונת הקונספט בלבד. אזור התאריכים נשאר נקי מפרסום כדי לשמור על הלוח קריא, נגיש ושימושי למשפחה.",
    multi: {
      title: "רוצים להופיע ביותר מחודש אחד?",
      text: "אפשר לבחור כמה חודשים שמתאימים לעסק, כל עוד יש התאמה ומקום פנוי.",
      tableTitle: "תמחור למספר חודשים:",
      anchorTitle: "למפרסמי עוגן",
      anchorRows: [
        "פרסום בודד בחודש אחד -1600 ש״ח",
        "2 פרסומים בחודשיים -1530 ש״ח לכל פרסום",
        "3 פרסומים -1450 ש״ח לכל פרסום",
        "מ-4 פרסומים ומעלה תקבלו 10% הנחה מהפרסום השני",
      ],
      complementaryTitle: "למפרסם משלים",
      complementaryRows: [
        "פרסום בודד בחודש אחד נע בין 1200 ל-1350 ש״ח, המחיר נקבע לפי המיקום",
        "2 פרסומים בחודשיים 5% הנחה על כל פרסום",
        "3 פרסומים ומעלה תקבלו 10% הנחה מהפרסום השני",
      ],
      cta: "לבדיקת חודשים נוספים",
    },
    microcopy:
      "בכל חודש יש מספר מוגבל של מקומות עוגן ומקומות משלימים. אין צורך במודעה מוכנה. המקום נשמר סופית רק לאחר אישור ההתאמה והשלמת התשלום.",
  },

  benefit: {
    eyebrow: "ההטבה שעובדת לשני הצדדים",
    title: `רוצים גם לדעת אם "זמנים" הביא אליכם לקוחות?`,
    body: [
      "כל עסק שמצטרף מוזמן לתת הטבה ייעודית למי שמגיע דרך הלוח.",
      `זה נותן למשפחה עוד סיבה לפנות דווקא אליכם,
ולכם - דרך פשוטה לזהות פניות שהגיעו מ"זמנים".`,
      `לא צריך מבצע ענק.
תנו סיבה קטנה וטובה לבחור בכם עכשיו.`,
    ],
  },

  howToJoin: {
    eyebrow: "איך מצטרפים?",
    title: "חמישה צעדים. בלי להסתבך.",
    cta: "לבחירת חודש ורמת נוכחות",
    microcopy:
      "הבחירה הראשונית לא מחייבת. המקום נשמר סופית לאחר אישור ההתאמה והשלמת התשלום.",
  },

  earlyBird: {
    eyebrow: "בונוס למצטרפים הראשונים",
    title: "ואם כבר נכנסים - כדאי להיכנס בזמן.",
    body: `מצטרפים לנבחרת "זמנים" עד כ' באלול
ומקבלים ערכת לוחות יוקרתית למשרד או לצוות.`,
    cta: "לבחירת חודש ורמת נוכחות",
    deadlineLabel: "כ' באלול",
    deadlineHebrewDay: 20,
    deadlineHebrewMonth: "אלול",
    // תשפ״ו — האלול שלפני מהדורת תשפ״ז, כלומר ההשקה הנוכחית
    deadlineHebrewYear: 5786,
  },

  about: {
    eyebrow: `מי עומד מאחורי "זמנים"?`,
    title: `נעים להכיר, "זמנים".`,
    body: [
      `הלוח החדשני "זמנים" נולד מתוך מחשבה על שני הצדדים של הפרסום:`,
      "מצד אחד - המשפחה שמכניסה מוצר הביתה וצריכה לקבל משהו שימושי, נעים ושווה מקום.",
      "ומצד שני - העסק שמשלם על פרסום ורוצה לדעת שהוא לא נעלם בתוך עומס, אלא מקבל נוכחות מכובדת ובהקשר הנכון.",
      "מהדורת תשפ״ז נבנית יחד עם אנשי מקצוע מתחומי העיצוב, הדפוס, ההפצה והמערכות - מהקונספט ועד ההגעה לבתים.",
      "כדי שתהיה לכם שנה מוצלחת באמת!",
    ],
  },

  faq: {
    eyebrow: "שאלות נפוצות",
    title: "שאלות שבעלי עסקים שואלים לפני שהם מצטרפים",
  },

  finalCta: {
    title: "לכל עסק יש זמן שבו הכי נכון לפגוש אותו.",
    subtitle: "השאלה היא אם המקום הזה עדיין פנוי.",
    body: "מספר המקומות בכל תחום מוגבל, וברגע שקטגוריה נסגרת - לא יתווספו אליה עוד עסקים במהדורה הקרובה.",
    ask: `ספרו לנו מה העסק שלכם עושה,
ונבדוק איפה הוא יכול להשתלב בצורה הכי טבעית ומה עדיין פנוי.`,
    primaryCta: "לבחירת חודש ורמת נוכחות",
    secondaryCta: "לא בטוחים מה מתאים? נעזור לבחור",
  },

  inquiry: {
    eyebrow: "יצירת קשר",
    title: "בואו נמצא לעסק שלכם את המקום הנכון.",
    intro:
      "כבר יודעים איזה חודש ואיזו רמת נוכחות אתם רוצים? אפשר לעבור ישירות לבחירה ולתשלום. הטופס כאן מיועד למי שרוצה שנעזור לו למצוא את האפשרות המתאימה.",
    businessNameLabel: "שם העסק",
    businessNamePlaceholder: "איך קוראים לעסק?",
    categoryLabel: "תחום הפעילות",
    categoryPlaceholder: "מה אתם מציעים?",
    locationLabel: "מיקום בארץ",
    contactNameLabel: "שם ליצירת קשר",
    phoneLabel: "טלפון",
    emailLabel: "מייל",
    monthGuessLabel: "יש חודש או קונספט שכבר חשבתם עליו?",
    noteLabel: "משהו שחשוב שנדע?",
    optionalHint: "לא חובה",
    submitLabel: "בדקו לי התאמה",
    microcopy:
      "אין צורך במודעה מוכנה. נחזור אליכם לאחר בדיקת ההתאמה והזמינות.",
    privacyNote:
      "שליחת הטופס מאשרת שימוש בפרטים לצורך מענה לפנייה ובהתאם למדיניות הפרטיות של האתר.",
  },

  popup: {
    title: "עוד לא ברור איפה העסק שלכם נכנס?",
    body: `כתבו לנו רק מה העסק עושה ואיך לחזור אליכם.
אנחנו נבדוק באיזה קונספט הוא יושב הכי טבעי ומה עדיין פנוי - בלי להתחייב.`,
    categoryLabel: "תחום העסק",
    categoryPlaceholder: "מה אתם מציעים?",
    contactLabel: "טלפון / מייל",
    contactPlaceholder: "איך נוח לחזור אליכם?",
    submitLabel: "בדקו לי מקום",
    dismissLabel: "אמשיך לעבור על החודשים",
  },

  status: {
    available: "פנוי להצטרפות",
    fillingUp: "מספר המקומות בתחום מוגבל",
    lastSpot: "נשאר מקום אחד בתחום הזה",
    taken: "התחום נתפס בחודש הזה",
    inquiryReceived:
      "הבקשה התקבלה. אנחנו בודקים התאמה וזמינות ונחזור אליכם עם הפרטים.",
    fitApproved: "המקום מתאים ופנוי. אפשר להמשיך לתשלום.",
    beforePayment:
      "שימו לב: המקום נשמר סופית רק לאחר השלמת התשלום.",
    afterPayment:
      "התשלום התקבל והמקום שלכם נשמר. עכשיו אפשר להעביר את חומרי העסק לעיצוב.",
    wrongCategory: `נראה שהחודש הזה פחות טבעי לעסק שלכם.
אל תדאגו - נבדוק עבורכם אפשרות מדויקת יותר.`,
  },

  footer: {
    tagline: "הפרסום הנכון בזמן הנכון.",
    links: [{ label: "יצירת קשר", href: "#contact" }],
    tosLabel: "תקנון",
    privacyLabel: "מדיניות פרטיות",
    // ריק בכוונה — אין עדיין עמוד מדיניות פרטיות, וקישור שבור גרוע
    // מקישור חסר. ברגע שיהיה עמוד, מזינים כאן כתובת והקישור מופיע.
    privacyHref: "",
  },

  seo: {
    title: "זמנים | פרסום לעסקים בלוח השנה תשפ״ז",
    description: `"זמנים" - לוח שנה שימושי המופץ בדיוור ישיר ל-30,000 בתי אב בבני ברק. בכל חודש קונספט חדש ונבחרת מצומצמת של עסקים שמשתלבים בדיוק בזמן הנכון. בדקו אילו מקומות עדיין פנויים.`,
  },
};

/* =============================================================== */

export const contentSchema = z.object({
  brand: z.object({
    siteName: z.string().min(1),
    tagline: z.string(),
    logoUrl: z.string().optional().nullable(),
  }),

  /** 2 · מסך ראשון */
  hero: z.object({
    eyebrow: z.string(),
    title: z.string().min(1),
    /** שורת הכותרת השנייה, בגודל קטן יותר */
    titleSecondary: z.string().default(defaultLandingHeroSecondary()),
    subtitle: z.string(),
    /** פסקה שנייה, מתחת לתת-הכותרת */
    body: z.string().default(""),
    primaryCta: z.string().min(1),
    secondaryCta: z.string(),
    /** מיקרו קופי מתחת לכפתורים */
    microcopy: z.string().default(""),
    /** פס הנתונים מתחת למסך הראשון */
    stats: z
      .array(
        z.object({
          icon: z.string().default(""),
          value: z.string(),
          /** מילת יחידה אחרי המספר, בשורה הראשונה */
          unit: z.string().default(""),
          label: z.string(),
        }),
      )
      .max(4),
  }),

  /** 6 · ארבע הסיבות "למה זה לא עוד מקום פרסום" */
  highlights: z
    .array(
      z.object({
        icon: z.string(),
        title: z.string(),
        text: z.string(),
      }),
    )
    .max(6),

  /** 10 · חמשת הצעדים */
  howItWorks: z
    .array(z.object({ title: z.string(), text: z.string() }))
    .max(6),

  /** 13 · שאלות ותשובות */
  faq: z.object({
    items: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
          /** כפתור אופציונלי בתוך התשובה */
          cta: z.string().default(""),
        }),
      )
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

  /**
   * כל שאר עמוד הנחיתה. default כדי שרשומת תוכן שנשמרה לפני
   * הסעיפים האלה תמשיך לעבור ולידציה ותקבל אותם — ולא תפיל את כל
   * התוכן חזרה לברירת מחדל ותמחק בכך עריכות קיימות.
   */
  landing: landingSchema.default(defaultLanding),
});

/** שורת הכותרת השנייה — פונקציה כדי שאפשר יהיה להשתמש בה כ-default */
function defaultLandingHeroSecondary(): string {
  return "העסק שלכם נכנס לתמונה";
}

export type SiteContentData = z.infer<typeof contentSchema>;

export const defaultContent: SiteContentData = {
  brand: {
    siteName: "ZMANIM",
    tagline: "הפרסום הנכון בזמן הנכון.",
    logoUrl: "/brand/zmanim-logo.png",
  },

  hero: {
    eyebrow: "בני ברק · מהדורת תשפ״ז",
    title: `יש פרסום זמני, ויש "זמנים".`,
    titleSecondary: "העסק שלכם נכנס לתמונה",
    subtitle: `"זמנים" הוא לוח שנה שימושי עם זמני "עיתים לבינה", שמגיע בדיוור ישיר ל-30,000 בתי אב בבני ברק.
בכל חודש נפתח עולם אחר, ובתוכו משתלבת נבחרת מצומצמת של עסקים שמתאימים בדיוק לאותו זמן ולסיטואציה.`,
    body: `ככה העסק שלכם לא נדחק בין מודעות.
הוא נמצא במקום שבו טבעי לראות אותו, בחודש שבו יש סיבה אמיתית לפגוש אותו.`,
    primaryCta: "לראות איפה העסק שלי משתלב",
    secondaryCta: "לצפייה בחודשים ובמקומות הפנויים",
    microcopy:
      "מספר המקומות בכל תחום מוגבל. אין צורך להגיע עם מודעה מוכנה.",
    stats: [
      { icon: "home", value: "30,000", unit: "בתי אב", label: "בבני ברק" },
      { icon: "mail", value: "דיוור ישיר", unit: "", label: "עד הבית" },
      {
        icon: "calendar",
        value: "קונספט אחר בכל חודש",
        unit: "",
        label: "בהתאמה לזמן ולעונה",
      },
      {
        icon: "users",
        value: "מספר מוגבל של עסקים",
        unit: "",
        label: "מכל תחום",
      },
    ],
  },

  highlights: [
    {
      icon: "home",
      title: "נכנסים הביתה",
      text: `"זמנים" מופץ בדיוור ישיר ל-30,000 בתי אב בבני ברק.
זה מוצר שנועד להיכנס לשימוש בבית - עם לוח שנה וזמני "עיתים לבינה" שיש סיבה אמיתית לחזור אליהם.`,
    },
    {
      icon: "clock",
      title: "נכנסים בזמן הנכון",
      text: "המטרה היא למצוא את החודש שבו המוצר או השירות שלכם מקבלים הקשר טבעי והופכים לרלוונטיים במיוחד.",
    },
    {
      icon: "users",
      title: "לא נבלעים בתוך כולם",
      text: `מספר העסקים מכל תחום מוגבל.
כשקטגוריה מתמלאת, היא נסגרת - כדי לשמור על העמוד נקי, על הקונספט מדויק ועל הנוכחות של כל עסק ברורה.`,
    },
    {
      icon: "palette",
      title: "ולא חייבים להגיע עם מודעה מוכנה",
      text: `אתם שולחים את חומרי העסק. אנחנו דואגים לחבר אותם לעולם של אותו חודש.
לוגו, פרטי קשר, מסר קצר והטבה - ומשם נבנית ההשתלבות בתוך הקונספט.`,
    },
  ],

  howItWorks: [
    {
      title: "בוחרים את החודש",
      text: "מוצאים את הקונספט שבו העסק שלכם יושב הכי טבעי ובודקים מה עדיין פנוי.",
    },
    {
      title: "בוחרים רמת נוכחות",
      text: "בוחרים אם העסק נכנס כמפרסם עוגן עם במה רחבה יותר, או כמפרסם משלים עם נוכחות ממוקדת יותר, ורואים מראש את המחיר של כל אפשרות.",
    },
    {
      title: "מוודאים התאמה וזמינות",
      text: "אנחנו מוודאים שהתחום מתאים לקונספט ושיש מקום פנוי ברמת הנוכחות שבחרתם לפני החיוב.",
    },
    {
      title: "משלימים תשלום ושומרים את המקום",
      text: "משלימים את הסליקה, והמקום נשמר עבור העסק שלכם.",
    },
    {
      title: "שולחים את חומרי העסק",
      text: "מעבירים לוגו, פרטים, מסר והטבה - ומכאן ממשיכים לעיצוב ולהשתלבות בתוך העמוד.",
    },
  ],

  faq: {
    items: [
      {
        question: "זו המהדורה הראשונה. למה שאצטרף עכשיו?",
        answer: `נכון, זו המהדורה הראשונה.
ולכן אנחנו לא מבקשים מכם להסתמך על סיפורי הצלחה מפוצצים.
הכל שקוף. לפני ההצטרפות אפשר לראות את הקונספטים, להבין את מבנה הלוח, לראות איפה העסק אמור להשתלב ולקבל את פרטי המהדורה והתפוצה.
ומצד שני, למהדורה ראשונה יש גם יתרון פשוט:
החודשים והקטגוריות נפתחים ממש עכשיו - ומי שמתאים ונכנס בזמן יכול לתפוס את המקום הנכון לפני שהתחום נסגר.`,
        cta: "",
      },
      {
        question: "אני לא יודע איזה חודש מתאים לעסק שלי.",
        answer: `בשביל זה לא חייבים לבחור לבד.
שלחו לנו את תחום העסק, ואנחנו נבדוק אילו קונספטים יכולים להתאים לו ומה עדיין זמין.`,
        cta: "בדקו לי איפה אני מתאים",
      },
      {
        question: "מה ההבדל בין מפרסם עוגן למפרסם משלים?",
        answer: `מפרסם עוגן מקבל נוכחות רחבה ומשמעותית יותר בתוך הסצנה של החודש. מפרסם משלים מקבל נוכחות ממוקדת סביב מוצר, שירות או נקודה טבעית בקונספט. בשני המקרים העסק משתלב בתוך התמונה עצמה - בלי להוסיף פרסום לתוך משבצות התאריכים.
הבחירה תלויה באופי העסק, בקונספט ובזמינות שנשארה באותו חודש.`,
        cta: "לראות את שתי רמות הנוכחות זו לצד זו",
      },
      {
        question: "אני צריך להכין מודעה?",
        answer: `לא.
המודל של "זמנים" בנוי דווקא כך שהעסק משתלב בתוך הקונספט ולא מדביק עליו מודעה רגילה.
נבקש מכם את הלוגו, פרטי הקשר, מסר קצר והטבה - ומשם תיבנה ההשתלבות בעמוד.`,
        cta: "",
      },
      {
        question: "לכמה זמן העסק שלי מופיע?",
        answer: `הנוכחות המרכזית שלכם היא בחודש שבחרתם - החודש שבו העסק שלכם הכי רלוונטי לקונספט.
הלוח עצמו נועד להישאר בבית ולשמש לאורך השנה.
רוצים להופיע ביותר מחודש אחד?
אפשר לבדוק חודשים נוספים, כל עוד יש התאמה ומקום פנוי.`,
        cta: "",
      },
      {
        question: "ומה אם התחום שלי כבר נתפס?",
        answer: `כדי לשמור על הערך של המפרסמים ועל עמוד נקי, אנו לא מכניסים בלי סוף עסקים מאותו תחום.
אם הקטגוריה כבר נסגרה בחודש מסוים, נבדוק אם יש לעסק שלכם חיבור טוב לחודש אחר.`,
        cta: "",
      },
      {
        question: "אני כבר מפרסם במקומות אחרים. למה אני צריך גם את זה?",
        answer: `אין צורך ש"זמנים" יחליף את כל מה שאתם כבר עושים.
הוא נותן סוג אחר של נוכחות:
להיכנס לתוך מוצר שימושי שנמצא בבית, ולהופיע בסביבה שמחברת את העסק שלכם לצורך רלוונטי.
השאלה היא לא כמה מקומות אתם מפרסמים בהם.
השאלה היא איפה נכון שהלקוח יפגוש אתכם בצורה קבועה ולא רק בעיתון שהולך לפח תוך כמה ימים...`,
        cta: "",
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
    phone: "052-717-3891",
    email: "zmanim678@gmail.com",
    whatsapp: null,
  },

  footer: {
    note: `לוח שנה עברי שימושי עם זמני "עיתים לבינה", קונספטים חודשיים ופרסום משולב לעסקים.`,
  },

  landing: defaultLanding,
};

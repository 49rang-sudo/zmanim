import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Gift,
  Handshake,
  HelpCircle,
  Home,
  Mail,
  MapPin,
  Palette,
  Quote,
  Sparkles,
  Star,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import { CountUpStat } from "./CountUpStat";
import { ClockMark } from "./ClockMark";
import { OrderCta } from "./OrderCta";
import { HoverAccordion } from "./HoverAccordion";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { formatPrice } from "@/lib/utils";
import { TIER_LABELS } from "@/lib/packages";
import type { SiteContentData } from "@/lib/content";
import type { LandingData } from "@/lib/landing-shared";
import type { Deadline } from "@/lib/hebrew-date";

export { SiteHeader, MobileCtaBar } from "./SiteHeader";

/* ===============================================================
   עמוד הנחיתה של "זמנים" — פורט מבני וויזואלי מילולי מ-
   zmanim2-base44/src/components/zmanim/*.jsx (המוקאפ שהמעצבת
   בנתה ב-Base44): אותו JSX tree, אותם classes (בשמות הטוקנים של
   Base44 — bg-card/text-primary/border-border וכו', ראו
   globals.css), אותם מרווחים וטיפוגרפיה.

   הקופי עצמו כבר תואם את המוקאפ מילה במילה (הושווה מול ה-JSX של
   Base44 בזמן הפורט הזה) — הוא ממשיך להגיע מ-content.landing
   (src/lib/content.ts), לא קשיח כאן, כי זה מה שהופך אותו לניתן
   לעריכה מלוח הניהול. מספרים אמיתיים (מחירים, מלאי) ממשיכים
   להגיע מ-getLandingData/AdSlot, לא מהמוקאפ.
   =============================================================== */

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  mail: Mail,
  calendar: Calendar,
  users: Users,
  clock: Clock,
  palette: Palette,
  "map-pin": MapPin,
  gift: Gift,
};

/** טקסט רב-שורתי מהתוכן — שורות הקופי נשמרות כפי שנכתבו */
function Prose({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return <p className={`whitespace-pre-line ${className}`}>{text}</p>;
}

/** תג-גלולה — הדפוס החוזר של כותרות המשנה במוקאפ העדכני (עודכן
    מקו-עין דק לתג pill; פורט מ-ContactForm.jsx/Difference.jsx:
    `bg-primary/10 rounded-full ... + נקודה`). עדכון חד-פעמי ברכיב
    המשותף — מתגלגל אוטומטית לכל סקשן שכבר קורא ל-<SectionEyebrow>. */
export function SectionEyebrow({
  text,
  className = "mb-5",
  center = false,
}: {
  text: string;
  className?: string;
  center?: boolean;
}) {
  return (
    <div className={`flex items-center ${center ? "justify-center" : ""} ${className}`}>
      <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold tracking-wide text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {text}
      </span>
    </div>
  );
}

/* ===============================================================
   2 · מסך ראשון — פורט מ-Hero.jsx
   =============================================================== */

export function Hero({ content }: { content: SiteContentData }) {
  const { hero } = content;

  return (
    <section className="relative overflow-hidden bg-foreground pb-10 pt-10 text-background lg:pt-14">
      {/* זוהר-מש דקורטיבי בגוני המותג מאחורי תוכן ההירו — פורט מ-
          Hero.jsx. בלי עטיפת hsl() נוספת: --color-primary כאן כבר
          ערך hsl(...) עטוף (לא triplet גולמי כמו בבייס44). */}
      <div className="pointer-events-none absolute inset-0 -z-0" aria-hidden="true">
        <div
          className="absolute -right-24 -top-24 h-[36rem] w-[36rem] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -left-32 top-10 h-[30rem] w-[30rem] rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* טקסט */}
          <div className="animate-[fade-up_0.6s_var(--ease-out-soft)_both]">
            <div className="mb-6 flex items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3.5 py-1.5 text-xs font-bold tracking-wide text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {hero.eyebrow}
              </span>
              <ClockMark className="h-20 w-20 shrink-0 lg:h-28 lg:w-28" />
            </div>

            <h1 className="text-balance font-heading text-[clamp(2.2rem,6vw,4.25rem)] font-extrabold leading-[1.05] tracking-tight text-background">
              {hero.title}
            </h1>
            {hero.titleSecondary ? (
              <p className="mt-4 font-heading text-xl font-bold text-background">
                {hero.titleSecondary}
              </p>
            ) : null}

            <Prose
              text={hero.subtitle}
              className="mt-5 max-w-xl text-base leading-[1.7] text-background/70"
            />
            {hero.body ? (
              <Prose
                text={hero.body}
                className="mt-4 max-w-xl text-base leading-[1.7] text-background/80"
              />
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <OrderCta
                href="#months"
                className="hover-lift inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground shadow-sm transition hover:brightness-105"
              >
                {hero.primaryCta}
                <ArrowLeft className="h-4 w-4" />
              </OrderCta>
              <OrderCta
                href="#months"
                className="hover-lift inline-flex h-12 items-center rounded-full border border-surface-dark-border bg-surface-dark px-6 font-bold text-background transition-colors hover:border-primary"
              >
                {hero.secondaryCta}
              </OrderCta>
            </div>

            {hero.microcopy ? (
              <p className="mt-4 text-xs text-background/70">{hero.microcopy}</p>
            ) : null}
          </div>

          {/* תמונה */}
          <div className="relative animate-[fade-up_0.7s_var(--ease-out-soft)_120ms_both]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl soft-shadow lg:aspect-[5/4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/hero-kitchen.png"
                alt="לוח זמנים תלוי במטבח"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            </div>
            <div className="absolute -bottom-4 right-6 rounded-2xl border border-border bg-card px-5 py-3 soft-shadow lg:right-10">
              <div className="text-xs text-muted-foreground">הפרסום הנכון</div>
              <div className="font-heading text-lg font-extrabold brand-gradient-text">
                בזמן הנכון
              </div>
            </div>
          </div>
        </div>

        {/* פס הנתונים */}
        {hero.stats.length > 0 ? (
          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border soft-shadow lg:grid-cols-4">
            {hero.stats.map((stat, index) => {
              const Icon = ICONS[stat.icon] ?? Sparkles;
              return (
                <div
                  key={index}
                  className="group flex items-center gap-4 bg-card p-5 transition-colors hover:bg-secondary/60"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary">
                    <Icon
                      className="h-5 w-5 text-primary transition-colors group-hover:text-primary-foreground"
                      strokeWidth={1.75}
                    />
                  </div>
                  <div>
                    <div className="font-heading text-lg font-extrabold leading-tight">
                      <CountUpStat value={stat.value} />
                      {stat.unit ? ` ${stat.unit}` : ""}
                    </div>
                    <div className="mt-0.5 text-xs leading-tight text-muted-foreground-strong">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ===============================================================
   3 · אז מה בעצם שונה כאן? — פורט מ-Difference.jsx
   =============================================================== */

export function Difference({ content }: { content: SiteContentData }) {
  const { difference } = content.landing;

  return (
    <section id="how" className="py-24 lg:py-36">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="max-w-3xl">
          <SectionEyebrow text={difference.eyebrow} />
          <h2 className="text-balance font-heading text-[clamp(1.9rem,4.5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
            {difference.title}
            <br />
            <span className="brand-gradient-text">{difference.subtitle}</span>
          </h2>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-5 text-base leading-[1.7] text-foreground/75">
            {difference.examples.map((example, index) => (
              <p key={index}>{example}</p>
            ))}
            {difference.paragraphs[0] ? (
              <p className="font-semibold text-foreground">{difference.paragraphs[0]}</p>
            ) : null}
          </div>

          <div className="hover-shadow rounded-2xl border border-border bg-card p-7 soft-shadow transition-colors hover:border-primary/60">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-bold">
                במקום קוביות פרסום משעממות
              </h3>
            </div>
            {difference.paragraphs.slice(1).map((paragraph, index) => (
              <Prose
                key={index}
                text={paragraph}
                className="mt-4 text-base leading-[1.6] text-foreground/75 first:mt-0"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   4 · המחשה ויזואלית — פורט מ-ConceptShowcase.jsx

   ההדמיות עצמן הן הסצנות האמיתיות מהמסד. הקופי מספק את הטקסט
   לכל פריט, והשדות monthLabel/conceptTitle שנשארו ריקים נמלאים
   מהחודש והסצנה האמיתיים שבאותו מיקום.
   =============================================================== */

export function Showcase({
  content,
  data,
}: {
  content: SiteContentData;
  data: LandingData;
}) {
  const { showcase } = content.landing;
  if (showcase.items.length === 0) return null;

  return (
    <section id="concepts" className="border-y border-border bg-card/60 py-24 lg:py-36">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mb-16 max-w-2xl">
          <SectionEyebrow text="המחשה ויזואלית" />
          <h2 className="text-balance font-heading text-[30px] font-bold leading-[1.15] tracking-tight text-foreground lg:text-[44px]">
            {showcase.title}
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-foreground/70">
            {showcase.subtitle}
          </p>
        </div>

        {/* 3 · שלושה קונספטים זה לצד זה (במקום שקופית-אחר-שקופית) —
            עדכון מבני 3א, פורט מ-ConceptGrid.jsx. חיווט הדאטה נשאר
            בדיוק כפי שהיה: data.months[index] לתמונה/כותרת אמיתית,
            showcase.items לקופי הנערך. */}
        <div className="grid gap-6 md:grid-cols-3">
          {showcase.items.map((item, index) => {
            const month = data.months[index];
            const monthLabel = item.monthLabel || month?.hebrewLabel || "";
            const conceptTitle = item.conceptTitle || month?.conceptTitle || "";
            const tag = monthLabel
              ? monthLabel.startsWith("חודש")
                ? monthLabel
                : `חודש ${monthLabel}`
              : null;

            return (
              <article
                key={index}
                className="hover-shadow group overflow-hidden rounded-3xl border border-border bg-background soft-shadow transition-colors hover:border-primary/60"
              >
                <div className="relative aspect-[16/11] overflow-hidden">
                  {month?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={month.imageUrl}
                      alt={`הדמיית הקונספט: ${conceptTitle}`}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-secondary" aria-hidden />
                  )}
                  {tag ? (
                    <div className="absolute right-4 top-4 rounded-full bg-background/90 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
                      {tag}
                    </div>
                  ) : null}
                </div>
                <div className="p-6">
                  {conceptTitle ? (
                    <h3 className="font-heading text-[20px] font-bold tracking-tight lg:text-[22px]">
                      {conceptTitle}
                    </h3>
                  ) : null}
                  <p className="mt-3 text-base leading-[1.6] text-foreground/75">
                    {item.text}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 max-w-3xl">
          <Prose
            text={showcase.closing}
            className="text-balance font-heading text-lg font-bold leading-[1.6] lg:text-xl"
          />
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   6 · למה זה לא עוד מקום פרסום — פורט מ-WhyNot.jsx
   =============================================================== */

export function WhyNotAnother({ content }: { content: SiteContentData }) {
  if (content.highlights.length === 0) return null;
  const { whyNotAnother } = content.landing;

  return (
    <section id="why" className="bg-foreground py-24 text-background lg:py-36">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mb-16 max-w-2xl">
          {/* אאייבראו בגרסה כהה (bg-primary/20, לא ה-SectionEyebrow
              המשותף עם bg-primary/10) — אותו עיקרון כמו ההירו וכמו
              WhyNot.jsx: קונטרסט על רקע כהה דורש גרסה חזקה יותר. */}
          <div className="mb-5 flex items-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3.5 py-1.5 text-xs font-bold tracking-wide text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {whyNotAnother.eyebrow}
            </span>
          </div>
          <h2 className="text-balance font-heading text-[30px] font-bold leading-[1.15] tracking-tight text-background lg:text-[44px]">
            {whyNotAnother.title}
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {content.highlights.map((item, index) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <div
                key={index}
                className="group rounded-2xl border border-surface-dark-border bg-surface-dark p-6 transition-colors duration-200 hover:border-primary hover:bg-surface-dark-border/40"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary">
                  <Icon
                    className="h-5 w-5 text-primary transition-colors group-hover:text-primary-foreground"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="mb-3 font-heading text-lg font-bold text-background">
                  {item.title}
                </h3>
                <Prose text={item.text} className="text-sm leading-[1.7] text-background/85" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   6.5 · הוכחה חברתית — פורט מ-SocialProof.jsx

   בלי framer-motion (לא תלות קיימת באתר האמיתי) — כרטיסי הציטוט
   מוצגים ישירות, בלי אנימציית scroll-reveal. מסתתר אוטומטית
   כשאין אף לוגו ואף ציטוט (content.landing.socialProof, ראו
   content.ts) — בדיוק כמו במקור.
   =============================================================== */

export function SocialProof({ content }: { content: SiteContentData }) {
  const { socialProof } = content.landing;
  if (socialProof.logos.length === 0 && socialProof.quotes.length === 0) {
    return null;
  }

  return (
    <section id="social-proof" className="py-24 lg:py-36">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mb-14 max-w-2xl">
          <SectionEyebrow text={socialProof.eyebrow} />
          <h2 className="text-balance font-heading text-[30px] font-bold leading-[1.15] tracking-tight text-foreground lg:text-[44px]">
            {socialProof.heading}
          </h2>
        </div>

        {socialProof.logos.length > 0 ? (
          <div className="mb-12 flex flex-wrap gap-3">
            {socialProof.logos.map((name, index) => (
              <span
                key={index}
                className="hover-shadow rounded-full border border-border bg-card px-5 py-2 font-heading text-base font-bold soft-shadow transition-colors hover:border-primary hover:text-primary"
              >
                {name}
              </span>
            ))}
          </div>
        ) : null}

        {socialProof.quotes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {socialProof.quotes.map((q, index) => (
              <blockquote
                key={index}
                className="hover-shadow rounded-2xl border border-border bg-card p-6 soft-shadow transition-colors hover:border-primary/60"
              >
                <Quote className="mb-4 h-7 w-7 text-primary" />
                <p className="text-base leading-[1.7] text-foreground/85">{q.quote}</p>
                <footer className="mt-5">
                  <div className="font-heading font-bold">{q.name}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground-strong">
                    {q.business}
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ===============================================================
   7 · מה מקבלים בפועל? — פורט מ-WhatYouGet.jsx
   =============================================================== */

export function WhatYouGet({ content }: { content: SiteContentData }) {
  const { whatYouGet } = content.landing;

  // אקורדיון אמיתי (Radix, src/components/ui/accordion.tsx) במקום שני
  // כרטיסים פתוחים במקביל - רק "מה שאתם מקבלים" פתוח כברירת מחדל, כדי
  // לא לשפוך את כל התוכן על המבקר/ת בבת אחת. תלות חדשה (@radix-ui/react-accordion)
  // שאושרה במפורש על ידי בעלת האתר. פורט מ-WhatYouGet.jsx.
  return (
    <section id="what-you-get" className="scroll-mt-20 py-24 lg:py-36">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mb-16 max-w-2xl">
          <SectionEyebrow text={whatYouGet.eyebrow} />
          <h2 className="text-balance font-heading text-[clamp(1.9rem,4.5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
            {whatYouGet.title}
          </h2>
        </div>

        <Accordion type="single" collapsible defaultValue="included" className="max-w-4xl space-y-3">
          <AccordionItem
            value="included"
            className="hover-shadow soft-shadow rounded-2xl border border-border bg-card px-6 transition-colors data-[state=open]:border-primary/40"
          >
            <AccordionTrigger className="py-5 font-heading text-xl font-bold">
              מה שאתם מקבלים
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <ul className="space-y-3">
                {whatYouGet.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm leading-relaxed">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="bring"
            className="hover-shadow soft-shadow rounded-2xl border border-border bg-secondary/60 px-6 transition-colors data-[state=open]:border-primary/40"
          >
            <AccordionTrigger className="py-5 font-heading text-xl font-bold">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
                  <Upload className="h-5 w-5 text-primary" />
                </span>
                {whatYouGet.bringTitle}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <p className="mb-5 text-sm leading-[1.7] text-foreground/80">
                {whatYouGet.bringText}
              </p>
              <p className="text-sm font-semibold leading-relaxed text-foreground">
                {whatYouGet.bringNote}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}

/* ===============================================================
   8 · מחיר ואפשרויות נוכחות — פורט מ-Pricing.jsx

   שני המחירים היחידים המלאים בעמוד. הם *לא* מגיעים מהקופי אלא
   מ-AdSlot.priceAgorot במסד — אותו מספר בדיוק שייגבה בקופה.
   =============================================================== */

function tierPriceLabel(range: { min: number; max: number } | null): string | null {
  if (!range) return null;
  return range.min === range.max
    ? formatPrice(range.min)
    : `${formatPrice(range.min)}–${formatPrice(range.max)}`;
}

export function Pricing({
  content,
  data,
}: {
  content: SiteContentData;
  data: LandingData;
}) {
  const { pricing } = content.landing;

  const tiers = [
    {
      key: "ANCHOR" as const,
      copy: pricing.anchor,
      range: data.prices.ANCHOR,
      rows: pricing.multi.anchorRows,
      rowsTitle: pricing.multi.anchorTitle,
      badge: "במה רחבה",
    },
    {
      key: "COMPLEMENTARY" as const,
      copy: pricing.complementary,
      range: data.prices.COMPLEMENTARY,
      rows: pricing.multi.complementaryRows,
      rowsTitle: pricing.multi.complementaryTitle,
      badge: "במה ממוקדת",
    },
  ];

  return (
    <section id="pricing" className="scroll-mt-20 border-y border-border bg-card/60 py-24 lg:py-36">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mb-16 max-w-2xl">
          <SectionEyebrow text={pricing.eyebrow} />
          <h2 className="text-balance font-heading text-[clamp(1.9rem,4.5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
            {pricing.title}
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-muted-foreground">{pricing.intro}</p>
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          {tiers.map(({ key, copy, range, badge }) => {
            const price = tierPriceLabel(range);
            const isAnchor = key === "ANCHOR";
            return (
              <div
                key={key}
                className={
                  isAnchor
                    ? "hover-shadow relative rounded-2xl border-2 border-primary/40 bg-background p-7 pt-9 soft-shadow transition-colors"
                    : "hover-shadow relative rounded-2xl border border-border bg-background p-7 soft-shadow transition-colors"
                }
              >
                {/* תג-סרט צף — "הבחירה הפופולרית" (Pricing.jsx שורות
                    ~50-52) — חסר עד כה באתר האמיתי, בנוסף לתג הקטן
                    שכבר קיים למטה. מוצג רק על כרטיס העוגן. */}
                {isAnchor ? (
                  <span className="absolute -top-3.5 right-7 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1 text-sm font-bold text-primary-foreground shadow-sm">
                    <Star className="h-3.5 w-3.5" /> הבחירה הפופולרית
                  </span>
                ) : null}
                <span
                  className={
                    isAnchor
                      ? "absolute left-5 top-5 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary"
                      : "absolute left-5 top-5 inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-bold text-foreground/70"
                  }
                >
                  {isAnchor ? <Star className="h-3.5 w-3.5" /> : null}
                  {badge}
                </span>

                <h3 className="mb-2 font-heading text-2xl font-extrabold">{copy.name}</h3>
                <p className="mb-5 text-sm leading-[1.7] text-muted-foreground">{copy.text}</p>
                {copy.includes ? (
                  <p className="mb-5 text-sm leading-[1.7] text-muted-foreground">
                    {copy.includes}
                  </p>
                ) : null}

                {price ? (
                  <div className="mb-5 flex items-baseline gap-2">
                    <span className="font-mono-nums text-4xl font-extrabold tnum">{price}</span>
                    <span className="text-sm text-muted-foreground">{pricing.priceLabel}</span>
                  </div>
                ) : null}

                <OrderCta
                  href="#order"
                  tier={key}
                  className={
                    isAnchor
                      ? "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground shadow-sm transition hover:brightness-105"
                      : "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-primary font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
                  }
                >
                  {copy.cta}
                  <ArrowLeft className="h-4 w-4" />
                </OrderCta>
              </div>
            );
          })}
        </div>

        <p className="mb-10 rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-muted-foreground">
          {pricing.bothNote}
        </p>

        {/* --- תמחור למספר חודשים --- */}
        <h3 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
          {pricing.multi.title}
        </h3>
        <p className="mt-2.5 max-w-2xl text-base leading-[1.7] text-muted-foreground">
          {pricing.multi.text}
        </p>

        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          {tiers.map(({ key, rows, rowsTitle }) => (
            <div key={key} className="overflow-hidden rounded-2xl border border-border bg-background">
              <div className="bg-secondary/60 px-5 py-3 font-heading font-bold">{rowsTitle}</div>
              <ul>
                {rows.map((row, index) => (
                  <li
                    key={index}
                    className={`px-5 py-4 text-sm leading-relaxed ${
                      index !== rows.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    {row}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-2xl border border-border bg-background p-6 sm:flex-row">
          <p className="font-heading text-lg font-bold">רוצים להופיע ביותר מחודש אחד?</p>
          <OrderCta
            href="#months"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground shadow-sm transition hover:brightness-105"
          >
            {pricing.multi.cta}
            <ArrowLeft className="h-4 w-4" />
          </OrderCta>
        </div>

        <p className="mt-5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {pricing.microcopy}
        </p>
      </div>
    </section>
  );
}

/* ===============================================================
   9 · ההטבה שעובדת לשני הצדדים — פורט מ-Benefit.jsx
   =============================================================== */

export function Benefit({ content }: { content: SiteContentData }) {
  const { benefit } = content.landing;

  return (
    <section id="benefit" className="py-24 lg:py-36">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 text-background soft-shadow lg:p-14">
          <div className="brand-gradient absolute -left-16 -top-16 h-64 w-64 rounded-full opacity-20 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/15">
                  <Handshake className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-semibold tracking-wide text-primary">
                  {benefit.eyebrow}
                </span>
              </div>
              <h2 className="text-balance font-heading text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-tight">
                {benefit.title}
              </h2>
            </div>
            <div className="space-y-4 text-base leading-[1.8] text-background/80">
              {benefit.body.map((paragraph, index) => (
                <Prose
                  key={index}
                  text={paragraph}
                  className={
                    index === benefit.body.length - 1
                      ? "font-heading font-bold text-background"
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   10 · איך מצטרפים? — פורט מ-Steps.jsx
   =============================================================== */

export function HowToJoin({ content }: { content: SiteContentData }) {
  if (content.howItWorks.length === 0) return null;
  const { howToJoin } = content.landing;

  return (
    <section id="steps" className="border-y border-border bg-card/60 py-24 lg:py-36">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mb-16 max-w-2xl">
          <SectionEyebrow text={howToJoin.eyebrow} />
          <h2 className="text-balance font-heading text-[clamp(1.9rem,4.5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
            {howToJoin.title}
          </h2>
        </div>

        {/* 3ג: פס hover-מתרחב אחד (HoverAccordion) במקום 5 כרטיסים
            סטטיים — פורט מ-Steps.jsx/HoverAccordion.jsx. זהו שינוי
            UX אמיתי, לא רק סגנון (ראו דיווח). חיווט הדאטה נשאר
            content.howItWorks כפי שהיה, רק ממופה ל-title/body. */}
        <HoverAccordion
          items={content.howItWorks.map((step) => ({
            title: step.title,
            body: step.text,
          }))}
        />

        <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row">
          <OrderCta
            href="#order"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 font-bold text-primary-foreground shadow-sm transition hover:brightness-105"
          >
            {howToJoin.cta}
            <ArrowLeft className="h-4 w-4" />
          </OrderCta>
          <p className="text-xs text-muted-foreground">{howToJoin.microcopy}</p>
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   11 · בונוס למצטרפים הראשונים — פורט מ-Bonus.jsx

   האזור נעלם מה-HTML עצמו ברגע שהמועד חלף — ההכרעה נעשית בשרת
   מול לוח השנה העברי האמיתי (resolveHebrewDeadline).
   =============================================================== */

export function EarlyBird({
  content,
  deadline,
}: {
  content: SiteContentData;
  deadline: Deadline | null;
}) {
  const { earlyBird } = content.landing;
  if (!deadline?.active) return null;

  return (
    <section id="bonus" className="py-24 lg:py-36">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-card p-8 soft-shadow lg:p-14">
          <div className="brand-gradient absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-10 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-semibold tracking-wide text-primary">
                  {earlyBird.eyebrow}
                </span>
              </div>
              <h2 className="text-balance font-heading text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
                {earlyBird.title}
              </h2>
              <Prose
                text={earlyBird.body}
                className="mt-4 max-w-xl text-base leading-[1.7] text-muted-foreground"
              />
              {/* התאריך הלועזי לצד העברי — הקהל מנהל יומן עסקי לועזי */}
              <p className="mt-4 text-xs font-semibold tracking-wide text-primary">
                {earlyBird.deadlineLabel} · {deadline.gregorianLabel}
              </p>
            </div>
            <OrderCta
              href="#order"
              className="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full bg-primary px-7 font-bold text-primary-foreground shadow-sm transition hover:brightness-105"
            >
              {earlyBird.cta}
              <ArrowLeft className="h-4 w-4" />
            </OrderCta>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   12 · מי עומד מאחורי "זמנים"? — פורט מ-About.jsx
   =============================================================== */

export function About({ content }: { content: SiteContentData }) {
  const { about } = content.landing;

  return (
    <section id="about" className="border-y border-border bg-card/60 py-24 lg:py-36">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionEyebrow text={about.eyebrow} />
            <h2 className="text-balance font-heading text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
              {about.title}
            </h2>
            <div className="mt-6 space-y-4 text-base leading-[1.8] text-foreground/80">
              {about.body.map((paragraph, index) => (
                <Prose
                  key={index}
                  text={paragraph}
                  className={
                    index === about.body.length - 1
                      ? "font-heading font-bold text-foreground"
                      : undefined
                  }
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { k: "30,000", v: "בתי אב בבני ברק" },
              { k: "12", v: "חודשים, 12 קונספטים" },
              { k: "1", v: "עסק מוביל מכל תחום" },
              { k: "365", v: "ימים על המקרר" },
            ].map((stat) => (
              <div
                key={stat.v}
                className="group hover-shadow rounded-2xl border border-border bg-background p-6 soft-shadow transition-colors duration-200 hover:border-primary"
              >
                <div className="font-mono-nums brand-gradient-text origin-right text-3xl font-extrabold transition-transform duration-300 group-hover:scale-110">
                  {stat.k}
                </div>
                <div className="mt-2 text-sm leading-tight text-muted-foreground">{stat.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   13 · שאלות — פורט מ-Faq.jsx (אקורדיון native, לא קיר טקסט)
   =============================================================== */

export function FAQ({ content }: { content: SiteContentData }) {
  if (content.faq.items.length === 0) return null;
  const { faq } = content.landing;

  return (
    <section id="faq" className="scroll-mt-20 py-24 lg:py-36">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <div className="mb-16 text-center">
          <SectionEyebrow text={faq.eyebrow} center className="mb-5 justify-center" />
          <h2 className="text-balance font-heading text-[clamp(1.9rem,4.5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
            {faq.title}
          </h2>
        </div>

        <div className="space-y-3">
          {content.faq.items.map((item, index) => (
            <details
              key={index}
              className="hover-shadow soft-shadow group rounded-2xl border border-border bg-card px-5 transition-colors open:border-primary/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-heading text-base font-bold marker:content-none lg:text-lg">
                {item.question}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180 group-open:text-primary" />
              </summary>

              <Prose
                text={item.answer}
                className="pb-5 text-sm leading-[1.75] text-muted-foreground lg:text-base"
              />

              {item.cta ? (
                <a
                  href="#contact"
                  className="mb-5 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold text-foreground transition hover:border-primary/60"
                >
                  {item.cta}
                  <ArrowLeft className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   14 · הנעה סופית — פורט מ-FinalCta.jsx
   =============================================================== */

export function FinalCta({ content }: { content: SiteContentData }) {
  const { finalCta } = content.landing;

  return (
    <section id="final" className="bg-foreground py-24 text-background lg:py-36">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance font-heading text-[clamp(1.9rem,5vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight text-background">
            {finalCta.title}
            <span className="brand-gradient-text mt-2 block">{finalCta.subtitle}</span>
          </h2>

          <p className="mt-5 text-lg leading-[1.7] text-background/85">{finalCta.body}</p>
          <Prose
            text={finalCta.ask}
            className="mt-4 text-lg leading-[1.7] text-background/85"
          />

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <OrderCta
              href="#order"
              className="hover-lift inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 font-bold text-primary-foreground shadow-sm transition hover:brightness-105"
            >
              {finalCta.primaryCta}
              <ArrowLeft className="h-4 w-4" />
            </OrderCta>
            {/* כפתור משני כהה — surface-dark/surface-dark-border מטוקני
                שלב 1, כמו FinalCta.jsx שורה ~37 (היה בעבר בהיר, לא
                מתאים לרקע הכהה החדש של הסקשן). */}
            <a
              href="#contact"
              className="hover-lift inline-flex items-center gap-2 rounded-full border border-surface-dark-border bg-surface-dark px-8 py-3.5 font-bold text-background transition-colors hover:border-primary/60"
            >
              <HelpCircle className="h-4 w-4" />
              {finalCta.secondaryCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   18 · פוטר — פורט מ-Footer.jsx
   =============================================================== */

export function SiteFooter({ content }: { content: SiteContentData }) {
  const { footer, nav } = content.landing;

  return (
    <footer className="bg-foreground pb-20 text-background lg:pb-0">
      <div className="mx-auto max-w-[120rem] px-5 py-14 lg:px-8">
        <div className="grid items-start gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* מותג + תיאור — שני עמודות רוחב (Footer.jsx: lg:col-span-2) */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/zmanim-logo-2.png"
                alt={content.brand.siteName}
                className="h-9 w-auto max-w-40 object-contain"
              />
              <div className="leading-none">
                <div className="mt-1 text-xs text-background/60">{footer.tagline}</div>
              </div>
            </div>
            <p className="max-w-md text-sm leading-[1.7] text-background/70">
              {content.footer.note}
            </p>
          </div>

          {/* עמודת ניווט-בדף — אותם קישורים בדיוק כמו בסרגל העליון
              (content.landing.nav.links), לא רשימה קשיחה נפרדת */}
          <div>
            <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-background/50">
              ניווט
            </div>
            <ul className="space-y-2.5">
              {nav.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-background/85 transition hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* עמודת קישורים + יצירת קשר */}
          <div>
            <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-background/50">
              קישורים
            </div>
            <ul className="space-y-2.5">
              {footer.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-background/85 transition hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              {footer.privacyHref ? (
                <li>
                  <a
                    href={footer.privacyHref}
                    className="text-sm text-background/85 transition hover:text-primary"
                  >
                    {footer.privacyLabel}
                  </a>
                </li>
              ) : null}
              <li>
                <OrderCta
                  href="#order"
                  className="text-sm text-background/85 transition hover:text-primary"
                >
                  {footer.tosLabel}
                </OrderCta>
              </li>
              {/* קוני הלוח מגיעים לכאן מהלוח המודפס עצמו, אבל מי שנחת
                  קודם באתר צריך גם הוא דרך למצוא את הטופס */}
              <li>
                <a
                  href="/receipts"
                  className="text-sm text-background/85 transition hover:text-primary"
                >
                  קניתם אצל עסק מהלוח? להעלאת קבלה להגרלה
                </a>
              </li>
            </ul>

            <div className="mb-4 mt-8 text-xs font-semibold uppercase tracking-wide text-background/50">
              יצירת קשר
            </div>
            <ul className="space-y-2.5">
              <li>
                <a
                  dir="ltr"
                  href={`mailto:${content.contact.email}`}
                  className="text-sm text-background/85 transition hover:text-primary"
                >
                  {content.contact.email}
                </a>
              </li>
              <li dir="ltr">
                <a
                  href={`tel:${content.contact.phone}`}
                  className="font-mono-nums text-sm text-background/85 transition hover:text-primary"
                >
                  {content.contact.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-background/15 pt-6 text-xs text-background/50">
          © {new Date().getFullYear()} {content.brand.siteName}
        </div>
      </div>
    </footer>
  );
}

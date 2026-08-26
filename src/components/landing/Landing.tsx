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
  Sparkles,
  Star,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import { CountUpStat } from "./CountUpStat";
import { ClockMark } from "./ClockMark";
import { OrderCta } from "./OrderCta";
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

/** קו-עין דק + תווית — הדפוס החוזר של כותרות המשנה במוקאפ (לא
    הפס-גרדיאנט העגול שהיה קודם; קו ישר דק בצבע primary בלבד) */
function SectionEyebrow({
  text,
  className = "mb-5",
  center = false,
}: {
  text: string;
  className?: string;
  center?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${center ? "justify-center" : ""} ${className}`}>
      <span className="h-px w-8 bg-primary" />
      <span className="text-xs font-semibold tracking-wide text-primary">{text}</span>
      {center ? <span className="h-px w-8 bg-primary" /> : null}
    </div>
  );
}

/* ===============================================================
   2 · מסך ראשון — פורט מ-Hero.jsx
   =============================================================== */

export function Hero({ content }: { content: SiteContentData }) {
  const { hero } = content;

  return (
    <section className="relative overflow-hidden pb-10 pt-10 lg:pt-14">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* טקסט */}
          <div className="animate-[fade-up_0.6s_var(--ease-out-soft)_both]">
            <div className="mb-6 flex items-center gap-4">
              <span className="h-px w-8 bg-primary" />
              <span className="text-xs font-semibold tracking-wide text-primary">
                {hero.eyebrow}
              </span>
              <ClockMark className="h-14 w-14 shrink-0" />
            </div>

            <h1 className="text-balance font-heading text-[clamp(2.2rem,6vw,4.25rem)] font-extrabold leading-[1.05] tracking-tight text-foreground">
              {hero.title}
            </h1>
            {hero.titleSecondary ? (
              <p className="mt-4 font-heading text-xl font-bold text-foreground">
                {hero.titleSecondary}
              </p>
            ) : null}

            <Prose
              text={hero.subtitle}
              className="mt-5 max-w-xl text-base leading-[1.7] text-muted-foreground"
            />
            {hero.body ? (
              <Prose
                text={hero.body}
                className="mt-4 max-w-xl text-base leading-[1.7] text-foreground/80"
              />
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <OrderCta
                href="#months"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground shadow-sm transition hover:brightness-105"
              >
                {hero.primaryCta}
                <ArrowLeft className="h-4 w-4" />
              </OrderCta>
              <OrderCta
                href="#months"
                className="inline-flex h-12 items-center rounded-full border border-border bg-card px-6 font-bold text-foreground transition hover:border-primary/60"
              >
                {hero.secondaryCta}
              </OrderCta>
            </div>

            {hero.microcopy ? (
              <p className="mt-4 text-xs text-muted-foreground">{hero.microcopy}</p>
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
                <div key={index} className="flex items-center gap-4 bg-card p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-heading text-lg font-extrabold leading-tight">
                      <CountUpStat value={stat.value} />
                      {stat.unit ? ` ${stat.unit}` : ""}
                    </div>
                    <div className="mt-0.5 text-xs leading-tight text-muted-foreground">
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
    <section id="how" className="py-20 lg:py-28">
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
          <div className="space-y-4 text-base leading-[1.8] text-foreground/85">
            {difference.examples.map((example, index) => (
              <p key={index}>{example}</p>
            ))}
            {difference.paragraphs[0] ? (
              <p className="font-semibold text-foreground">{difference.paragraphs[0]}</p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-card p-7 soft-shadow">
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
                className="mt-4 text-base leading-[1.8] text-foreground/80 first:mt-0"
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
    <section id="concepts" className="border-y border-border bg-card/60 py-20 lg:py-28">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <SectionEyebrow text="המחשה ויזואלית" />
          <h2 className="text-balance font-heading text-[clamp(1.9rem,4.5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
            {showcase.title}
            <br />
            {showcase.subtitle}
          </h2>
        </div>

        <div className="space-y-8">
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
              <div
                key={index}
                className={`grid items-center gap-6 lg:grid-cols-2 lg:gap-10 ${
                  index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-3xl soft-shadow">
                  {month?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={month.imageUrl}
                      alt={`הדמיית הקונספט: ${conceptTitle}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-secondary" aria-hidden />
                  )}
                  {tag ? (
                    <div className="absolute right-4 top-4 rounded-full bg-background/85 px-4 py-1.5 text-xs font-semibold backdrop-blur-sm">
                      {tag}
                    </div>
                  ) : null}
                </div>
                <div>
                  {conceptTitle ? (
                    <h3 className="font-heading text-2xl font-extrabold tracking-tight lg:text-3xl">
                      {conceptTitle}
                    </h3>
                  ) : null}
                  <p className="mt-4 text-base leading-[1.8] text-foreground/80 lg:text-lg">
                    {item.text}
                  </p>
                </div>
              </div>
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
    <section id="why" className="border-y border-border bg-card/60 py-20 lg:py-28">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <SectionEyebrow text={whyNotAnother.eyebrow} />
          <h2 className="text-balance font-heading text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.15] tracking-tight text-foreground">
            {whyNotAnother.title}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.highlights.map((item, index) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <div key={index} className="rounded-2xl border border-border bg-background p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="mb-3 font-heading text-lg font-bold">{item.title}</h3>
                <Prose
                  text={item.text}
                  className="text-sm leading-[1.7] text-muted-foreground"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   7 · מה מקבלים בפועל? — פורט מ-WhatYouGet.jsx
   =============================================================== */

export function WhatYouGet({ content }: { content: SiteContentData }) {
  const { whatYouGet } = content.landing;

  return (
    <section id="what-you-get" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <SectionEyebrow text={whatYouGet.eyebrow} />
          <h2 className="text-balance font-heading text-[clamp(1.9rem,4.5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
            {whatYouGet.title}
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-7 soft-shadow">
            <h3 className="mb-5 font-heading text-xl font-bold">מה שאתם מקבלים</h3>
            <ul className="space-y-3">
              {whatYouGet.items.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-sm leading-relaxed">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/60 p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-bold">{whatYouGet.bringTitle}</h3>
            </div>
            <p className="mb-5 text-sm leading-[1.7] text-foreground/80">
              {whatYouGet.bringText}
            </p>
            <p className="text-sm font-semibold leading-relaxed text-foreground">
              {whatYouGet.bringNote}
            </p>
          </div>
        </div>
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
    <section id="pricing" className="scroll-mt-20 border-y border-border bg-card/60 py-20 lg:py-28">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mb-12 max-w-2xl">
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
                    ? "relative rounded-2xl border-2 border-primary/40 bg-background p-7 soft-shadow"
                    : "relative rounded-2xl border border-border bg-background p-7 soft-shadow"
                }
              >
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
    <section id="benefit" className="py-20 lg:py-28">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 text-background lg:p-14">
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
    <section id="steps" className="border-y border-border bg-card/60 py-20 lg:py-28">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <SectionEyebrow text={howToJoin.eyebrow} />
          <h2 className="text-balance font-heading text-[clamp(1.9rem,4.5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
            {howToJoin.title}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {content.howItWorks.map((step, index) => (
            <div key={index} className="relative rounded-2xl border border-border bg-background p-6">
              <div className="brand-gradient mb-4 flex h-11 w-11 items-center justify-center rounded-full font-heading text-lg font-extrabold text-white">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="mb-2 font-heading text-base font-bold leading-tight">
                {step.title}
              </h3>
              <p className="text-sm leading-[1.65] text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>

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
    <section id="bonus" className="py-20 lg:py-28">
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
    <section id="about" className="border-y border-border bg-card/60 py-20 lg:py-28">
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
              <div key={stat.v} className="rounded-2xl border border-border bg-background p-6">
                <div className="font-mono-nums brand-gradient-text text-3xl font-extrabold">
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
    <section id="faq" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <div className="mb-12 text-center">
          <SectionEyebrow text={faq.eyebrow} center className="mb-5 justify-center" />
          <h2 className="text-balance font-heading text-[clamp(1.9rem,4.5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
            {faq.title}
          </h2>
        </div>

        <div className="space-y-3">
          {content.faq.items.map((item, index) => (
            <details
              key={index}
              className="group rounded-2xl border border-border bg-card px-5 open:border-primary/40"
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
    <section id="final" className="border-y border-border bg-card/60 py-20 lg:py-28">
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance font-heading text-[clamp(1.9rem,5vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
            {finalCta.title}
            <span className="brand-gradient-text mt-2 block">{finalCta.subtitle}</span>
          </h2>

          <p className="mt-5 text-lg leading-[1.7] text-muted-foreground">{finalCta.body}</p>
          <Prose
            text={finalCta.ask}
            className="mt-4 text-lg leading-[1.7] text-foreground/85"
          />

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <OrderCta
              href="#order"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 font-bold text-primary-foreground shadow-sm transition hover:brightness-105"
            >
              {finalCta.primaryCta}
              <ArrowLeft className="h-4 w-4" />
            </OrderCta>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-8 py-3.5 font-bold text-foreground transition hover:border-primary/60"
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
  const { footer } = content.landing;

  return (
    <footer className="bg-foreground pb-20 text-background lg:pb-0">
      <div className="mx-auto max-w-[120rem] px-5 py-14 lg:px-8">
        <div className="grid items-start gap-10 md:grid-cols-2">
          <div>
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

          <div className="md:text-left">
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
                <a href="#order" className="text-sm text-background/85 transition hover:text-primary">
                  {footer.tosLabel}
                </a>
              </li>
              <li>
                <a
                  dir="ltr"
                  href={`mailto:${content.contact.email}`}
                  className="text-sm text-background/85 transition hover:text-primary"
                >
                  {content.contact.email}
                </a>
              </li>
              <li dir="ltr" className="text-sm text-background/70">
                {content.contact.phone}
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
          </div>
        </div>
        <div className="mt-12 border-t border-background/15 pt-6 text-xs text-background/50">
          © {new Date().getFullYear()} {content.brand.siteName}
        </div>
      </div>
    </footer>
  );
}

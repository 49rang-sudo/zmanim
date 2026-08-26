import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock,
  Gift,
  Home,
  Mail,
  MapPin,
  Palette,
  Sparkles,
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

/* ===============================================================
   עמוד הנחיתה של "זמנים" — הקופי כולו מגיע מ-content.landing
   (ראו src/lib/content.ts), והמספרים כולם מגיעים מ-getLandingData.
   אין כאן מחרוזת שיווקית קשיחה ואין מספר קשיח: מה שכתוב בעמוד
   הוא מה שיש במסד.
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

/** כותרת אזור אחידה: תווית מונוספייס + פס גרדיאנט + כותרת */
function SectionHead({
  eyebrow,
  title,
  subtitle,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow ? (
        <div className="mb-5 flex items-center gap-3.5">
          <span className="progress-rule w-8 rounded-full" />
          <span className="text-[12.5px] font-semibold tracking-wide text-accent">
            {eyebrow}
          </span>
        </div>
      ) : null}

      <h2 className="max-w-4xl whitespace-pre-line font-display text-[2rem] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-[2.4rem]">
        {title}
      </h2>

      {subtitle ? (
        <Prose
          text={subtitle}
          className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-2"
        />
      ) : null}
    </div>
  );
}

/* ===============================================================
   1 · תפריט עליון

   הערה על יעדי הכפתורים בכל הקובץ (ראו src/lib/order-focus.ts):
   כפתור שהקופי שלו אומר *לבחור* מוביל לאשף ההזמנה (#order),
   וכפתור שהקופי שלו אומר *לראות/לצפות/לבדוק* מוביל לתצוגה
   המקדימה של החודשים (#months). קישורי התפריט הם ניווט מפורש
   ונשארים קישורי עוגן רגילים.
   =============================================================== */

export function SiteHeader({ content }: { content: SiteContentData }) {
  const { nav } = content.landing;

  return (
    <header className="glass sticky top-0 z-30 border-b border-line">
      <div className="mx-auto flex max-w-[1200px] items-center gap-5 px-5 py-2.5 lg:px-8">
        <a href="/" className="flex shrink-0 items-center py-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.brand.logoUrl ?? "/brand/zmanim-logo.png"}
            alt={content.brand.siteName}
            className="h-10 w-auto max-w-44 object-contain sm:h-12"
          />
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] font-medium text-ink-2 transition-colors duration-200 ease-smooth hover:text-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* "בחירת חודש ומקום" — כפתור בחירה, ולכן לאשף. הוא דביק
            וגלוי גם באמצע ההזמנה, ואז הוא הדרך *חזרה* אליה. */}
        <OrderCta
          href="#order"
          className="brand-cta shine-cta mr-auto inline-flex h-[38px] shrink-0 items-center px-5 text-[13.5px] font-bold lg:mr-0"
        >
          {nav.cta}
        </OrderCta>
      </div>
    </header>
  );
}

/**
 * כפתור קבוע בתחתית מסך המובייל — בקשה מפורשת בקופי (סעיף 1).
 * מוסתר במסכים גדולים, שם הכפתור בסרגל העליון ממילא תמיד גלוי.
 */
export function MobileCtaBar({ content }: { content: SiteContentData }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas p-3 lg:hidden">
      <OrderCta
        href="#order"
        className="brand-cta shine-cta flex h-12 items-center justify-center text-[15px] font-bold"
      >
        {content.landing.nav.mobileCta}
      </OrderCta>
    </div>
  );
}

/* ===============================================================
   2 · מסך ראשון
   =============================================================== */

export function Hero({ content }: { content: SiteContentData }) {
  const { hero } = content;

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="relative mx-auto max-w-[1200px] px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <div className="mb-7 flex items-center gap-4 animate-[fade-up_0.5s_var(--ease-out-soft)_both]">
              <ClockMark className="size-14 shrink-0" />
              <div className="flex items-center gap-3.5">
                <span className="progress-rule w-8 rounded-full" />
                <span className="text-[12.5px] font-semibold tracking-wide text-accent">
                  {hero.eyebrow}
                </span>
              </div>
            </div>

            <h1 className="display-hero max-w-[16ch] text-ink animate-[fade-up_0.5s_var(--ease-out-soft)_60ms_both]">
              {hero.title}
              {hero.titleSecondary ? (
                <span
                  className="gradient-num mt-2 block text-[0.52em] leading-tight"
                  style={{ animation: "hero-pulse 1.6s ease-in-out 0.6s infinite" }}
                >
                  {hero.titleSecondary}
                </span>
              ) : null}
            </h1>

            <Prose
              text={hero.subtitle}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2 animate-[fade-up_0.5s_var(--ease-out-soft)_130ms_both]"
            />

            {hero.body ? (
              <Prose
                text={hero.body}
                className="mt-6 max-w-2xl border-e-2 border-accent pe-4 text-lg font-medium leading-relaxed text-ink animate-[fade-up_0.5s_var(--ease-out-soft)_170ms_both]"
              />
            ) : null}

            <div
              className="mt-9 flex w-max max-w-full flex-wrap items-stretch gap-3 animate-[fade-up_0.5s_var(--ease-out-soft)_both]"
              style={{ animationDelay: "200ms" }}
            >
              {/* שני כפתורי המסך הראשון מבטיחים *לראות* ("לראות
                  איפה העסק שלי משתלב" / "לצפייה בחודשים ובמקומות
                  הפנויים") — ולכן לתצוגה המקדימה, לא לאשף. */}
              <OrderCta
                href="#months"
                className="brand-cta shine-cta inline-flex items-center px-7 py-4 text-base font-bold"
              >
                {hero.primaryCta}
              </OrderCta>

              <OrderCta
                href="#months"
                className="inline-flex items-center rounded-full border border-line bg-surface px-6 py-4 text-base font-medium text-ink transition-colors duration-200 ease-smooth hover:bg-surface-2"
              >
                {hero.secondaryCta}
              </OrderCta>
            </div>

            {hero.microcopy ? (
              <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-ink-2 animate-[fade-up_0.5s_var(--ease-out-soft)_260ms_both]">
                {hero.microcopy}
              </p>
            ) : null}
          </div>

          <div className="flex items-start justify-center lg:justify-end">
            <div className="w-full max-w-[420px] animate-[fade-up_0.7s_var(--ease-out-soft)_180ms_both] overflow-hidden rounded-3xl soft-shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/hero-preview.png"
                alt="דוגמה לגיליון של הלוח"
                className="aspect-[4/3] h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* --- פס הנתונים מתחת למסך הראשון --- */}
        {hero.stats.length > 0 ? (
          <dl className="relative mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line soft-shadow lg:grid-cols-4">
            {hero.stats.map((stat, index) => {
              const Icon = ICONS[stat.icon] ?? Sparkles;
              return (
                <div key={index} className="bg-canvas px-4 py-6">
                  <span className="mb-2.5 grid size-11 place-items-center rounded-full bg-surface-2">
                    <Icon className="size-5 text-accent" strokeWidth={1.75} />
                  </span>
                  <dd className="font-display text-[17px] font-extrabold leading-tight text-ink">
                    <CountUpStat value={stat.value} />
                    {stat.unit ? ` ${stat.unit}` : ""}
                  </dd>
                  <dt className="mt-1 text-[13.5px] leading-snug text-ink-2">
                    {stat.label}
                  </dt>
                </div>
              );
            })}
          </dl>
        ) : null}
      </div>
    </section>
  );
}

/* ===============================================================
   3 · אז מה בעצם שונה כאן?
   =============================================================== */

export function Difference({ content }: { content: SiteContentData }) {
  const { difference } = content.landing;

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHead
          eyebrow={difference.eyebrow}
          title={`${difference.title}\n${difference.subtitle}`}
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {difference.examples.map((example, index) => (
            <div
              key={index}
              className="rounded-2xl border border-line bg-surface p-6 soft-shadow"
            >
              <span className="text-[12px] font-semibold text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 text-[15.5px] leading-relaxed text-ink">
                {example}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid max-w-4xl gap-5">
          {difference.paragraphs.map((paragraph, index) => (
            <Prose
              key={index}
              text={paragraph}
              className={
                index === 0
                  ? "font-display text-xl font-extrabold tracking-tight text-ink"
                  : "text-[16.5px] leading-relaxed text-ink-2"
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   4 · המחשה ויזואלית — ההדמיות של החודשים

   ההדמיות עצמן הן הסצנות האמיתיות מהמסד. הקופי מספק את הטקסט
   לכל פריט, והשדות monthLabel/conceptTitle שנשארו ריקים נמלאים
   מהחודש והסצנה האמיתיים שבאותו מיקום — כך ההדמיה בעמוד השיווקי
   ובבורר לעולם לא מציגות שני קונספטים שונים לאותו חודש.
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
    <section className="border-y border-line bg-surface/60">
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHead title={`${showcase.title}\n${showcase.subtitle}`} />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {showcase.items.map((item, index) => {
            const month = data.months[index];
            const monthLabel = item.monthLabel || month?.hebrewLabel || "";
            const conceptTitle = item.conceptTitle || month?.conceptTitle || "";

            return (
              <figure
                key={index}
                className="flex flex-col overflow-hidden rounded-2xl border border-line bg-canvas soft-shadow"
              >
                {month?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={month.imageUrl}
                    alt={`הדמיית הקונספט: ${conceptTitle}`}
                    className="w-full object-cover"
                    style={{ aspectRatio: String(month.aspectRatio) }}
                  />
                ) : (
                  <div
                    className="w-full bg-surface-2"
                    style={{ aspectRatio: "1.5" }}
                    aria-hidden
                  />
                )}

                <figcaption className="flex flex-1 flex-col p-6">
                  {monthLabel ? (
                    <span className="text-[12px] font-semibold text-accent">
                      {monthLabel.startsWith("חודש")
                        ? monthLabel
                        : `חודש ${monthLabel}`}
                    </span>
                  ) : null}

                  {conceptTitle ? (
                    <h3 className="mt-2 font-display text-xl font-extrabold tracking-tight text-ink">
                      {conceptTitle}
                    </h3>
                  ) : null}

                  <p className="mt-2.5 text-[15px] leading-relaxed text-ink-2">
                    {item.text}
                  </p>
                </figcaption>
              </figure>
            );
          })}
        </div>

        <Prose
          text={showcase.closing}
          className="mt-10 max-w-3xl border-e-2 border-accent pe-5 font-display text-xl font-extrabold leading-snug tracking-tight text-ink"
        />
      </div>
    </section>
  );
}

/* ===============================================================
   6 · למה זה לא עוד מקום פרסום
   =============================================================== */

export function WhyNotAnother({ content }: { content: SiteContentData }) {
  if (content.highlights.length === 0) return null;
  const { whyNotAnother } = content.landing;

  return (
    <section className="border-y border-line bg-surface/60">
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHead eyebrow={whyNotAnother.eyebrow} title={whyNotAnother.title} />

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {content.highlights.map((item, index) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <article
                key={index}
                className="group rounded-2xl border border-line bg-canvas p-7 soft-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="grid size-11 place-items-center rounded-full bg-surface-2">
                    <Icon
                      className="size-5 text-muted transition-colors duration-300 ease-smooth group-hover:text-accent"
                      strokeWidth={1.75}
                    />
                  </span>
                </div>

                <h3 className="mt-5 font-display text-xl font-extrabold tracking-tight text-ink">
                  {item.title}
                </h3>
                <Prose
                  text={item.text}
                  className="mt-2.5 text-[15px] leading-relaxed text-ink-2"
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   7 · מה מקבלים בפועל?
   =============================================================== */

export function WhatYouGet({ content }: { content: SiteContentData }) {
  const { whatYouGet } = content.landing;

  return (
    <section id="what-you-get" className="scroll-mt-20 border-b border-line">
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHead eyebrow={whatYouGet.eyebrow} title={whatYouGet.title} />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line soft-shadow">
            {whatYouGet.items.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3.5 bg-canvas px-6 py-4"
              >
                <span className="mt-0.5 shrink-0 text-[12px] font-semibold text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[15.5px] leading-relaxed text-ink">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <aside className="h-max rounded-2xl border border-line bg-surface-2 p-7">
            <h3 className="font-display text-xl font-extrabold tracking-tight text-ink">
              {whatYouGet.bringTitle}
            </h3>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">
              {whatYouGet.bringText}
            </p>
            <p className="mt-4 border-t border-line pt-4 text-[15px] font-semibold leading-relaxed text-ink">
              {whatYouGet.bringNote}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   8 · מחיר ואפשרויות נוכחות

   שני המחירים היחידים המלאים בעמוד. הם *לא* מגיעים מהקופי אלא
   מ-AdSlot.priceAgorot במסד — אותו מספר בדיוק שייגבה בקופה.
   =============================================================== */

function tierPriceLabel(
  range: { min: number; max: number } | null,
): string | null {
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
    },
    {
      key: "COMPLEMENTARY" as const,
      copy: pricing.complementary,
      range: data.prices.COMPLEMENTARY,
      rows: pricing.multi.complementaryRows,
      rowsTitle: pricing.multi.complementaryTitle,
    },
  ];

  return (
    <section
      id="pricing"
      className="snap-section scroll-mt-20 border-b border-line-2"
    >
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHead
          eyebrow={pricing.eyebrow}
          title={pricing.title}
          subtitle={pricing.intro}
        />

        <div className="mt-10 grid gap-px border border-line-2 bg-line-2 lg:grid-cols-2">
          {tiers.map(({ key, copy, range }) => {
            const price = tierPriceLabel(range);
            return (
              <article key={key} className="flex flex-col bg-canvas p-7">
                <div className="flex items-center gap-2.5">
                  <span
                    className={
                      key === "ANCHOR"
                        ? "mono-label bg-ink px-2 py-1 text-[11px] text-canvas"
                        : "mono-label border border-line-2 px-2 py-1 text-[11px] text-ink"
                    }
                  >
                    {TIER_LABELS[key]}
                  </span>
                  <h3 className="font-display text-xl font-extrabold tracking-tight text-ink">
                    {copy.name}
                  </h3>
                </div>

                <p className="mt-4 flex-1 text-[15.5px] leading-relaxed text-ink-2">
                  {copy.text}
                </p>

                {price ? (
                  <p className="mt-6 flex items-baseline gap-2.5 border-t border-line pt-5">
                    <span className="mono-label text-[12px] text-ink-2">
                      {pricing.priceLabel}
                    </span>
                    <span className="tnum font-display text-3xl font-black leading-none text-ink">
                      {price}
                    </span>
                  </p>
                ) : null}

                {copy.includes ? (
                  <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                    {copy.includes}
                  </p>
                ) : null}

                {/* "לבחירת חודש ונוכחות עוגן/משלימה" — כפתור
                    בחירה, ולכן לאשף, ועם הדרגה שהוא הבטיח. זה
                    בדיוק הכפתור שהלקוחה לחצה כשרצתה להגדיל
                    חשיפה, וקודם הוא זרק אותה כלפי מעלה. */}
                <OrderCta
                  href="#order"
                  tier={key}
                  className="brand-cta shine-cta mt-6 inline-flex items-center justify-center px-6 py-3.5 text-[15px] font-bold"
                >
                  {copy.cta}
                </OrderCta>
              </article>
            );
          })}
        </div>

        <Prose
          text={pricing.bothNote}
          className="mt-6 max-w-4xl border-e-2 border-accent pe-4 text-[15px] leading-relaxed text-ink"
        />

        {/* --- תמחור למספר חודשים --- */}
        <div className="mt-12 border border-line-2 bg-surface p-7 lg:p-9">
          <h3 className="font-display text-2xl font-extrabold tracking-tight text-ink">
            {pricing.multi.title}
          </h3>
          <p className="mt-2.5 max-w-2xl text-[15.5px] leading-relaxed text-ink-2">
            {pricing.multi.text}
          </p>

          <p className="mono-label mt-7 text-[12px] text-ink-2">
            {pricing.multi.tableTitle}
          </p>

          <div className="mt-4 grid gap-px border border-line-2 bg-line-2 sm:grid-cols-2">
            {tiers.map(({ key, rows, rowsTitle }) => (
              <div key={key} className="bg-canvas p-6">
                <h4 className="font-display text-lg font-extrabold tracking-tight text-ink">
                  {rowsTitle}
                </h4>
                <ul className="mt-3 grid gap-2.5">
                  {rows.map((row, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink-2"
                    >
                      <span
                        className="mt-2 size-1.5 shrink-0 bg-accent"
                        aria-hidden
                      />
                      {row}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* "לבדיקת חודשים נוספים" — כפתור בדיקה, ולכן לתצוגה
              המקדימה שבה רואים את כל החודשים זה לצד זה. */}
          <OrderCta
            href="#months"
            className="mt-7 inline-flex items-center gap-2 border border-line-2 px-6 py-3.5 text-[15px] font-bold text-ink transition-colors duration-200 ease-smooth hover:bg-surface-2"
          >
            {pricing.multi.cta}
            <ArrowLeft className="size-4" />
          </OrderCta>
        </div>

        <p className="mt-6 max-w-4xl text-[13.5px] leading-relaxed text-ink-2">
          {pricing.microcopy}
        </p>
      </div>
    </section>
  );
}

/* ===============================================================
   9 · ההטבה שעובדת לשני הצדדים
   =============================================================== */

export function Benefit({ content }: { content: SiteContentData }) {
  const { benefit } = content.landing;

  return (
    <section className="snap-section dark-zone border-b border-line-2">
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <SectionHead eyebrow={benefit.eyebrow} title={benefit.title} />

          <div className="grid content-start gap-5 self-end">
            {benefit.body.map((paragraph, index) => (
              <Prose
                key={index}
                text={paragraph}
                className="text-[16.5px] leading-relaxed text-ink-2"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   10 · איך מצטרפים?
   =============================================================== */

export function HowToJoin({ content }: { content: SiteContentData }) {
  if (content.howItWorks.length === 0) return null;
  const { howToJoin } = content.landing;

  return (
    <section id="how" className="snap-section scroll-mt-20 border-b border-line-2">
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHead eyebrow={howToJoin.eyebrow} title={howToJoin.title} />

        <ol className="mt-10 grid gap-px border border-line-2 bg-line-2">
          {content.howItWorks.map((step, index) => (
            <li
              key={index}
              className="grid gap-2 bg-canvas p-6 sm:grid-cols-[80px_240px_1fr] sm:items-baseline sm:gap-6"
            >
              <span className="gradient-num font-display text-4xl font-black leading-none">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-lg font-extrabold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-ink-2">
                {step.text}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <OrderCta
            href="#order"
            className="brand-cta shine-cta inline-flex items-center px-7 py-4 text-base font-bold"
          >
            {howToJoin.cta}
          </OrderCta>
          <p className="max-w-md text-[13.5px] leading-relaxed text-ink-2">
            {howToJoin.microcopy}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   11 · בונוס למצטרפים הראשונים

   האזור נעלם מה-HTML עצמו ברגע שהמועד חלף — ההכרעה נעשית בשרת
   מול לוח השנה העברי האמיתי (resolveHebrewDeadline), ולא בהסתרה
   ויזואלית בדפדפן.
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
    <section className="snap-section border-b border-line-2 bg-surface-2">
      <div className="mx-auto max-w-[1200px] px-5 py-14 lg:px-8">
        <div className="grid gap-7 border border-line-2 bg-canvas p-7 lg:grid-cols-[1fr_auto] lg:items-center lg:p-9">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Gift className="size-5 text-accent" strokeWidth={1.75} />
              <span className="mono-label text-[12.5px] text-ink-2">
                {earlyBird.eyebrow}
              </span>
            </div>

            <h2 className="font-display text-[1.9rem] font-extrabold leading-tight tracking-tight text-ink">
              {earlyBird.title}
            </h2>

            <Prose
              text={earlyBird.body}
              className="mt-3.5 max-w-2xl text-[16.5px] leading-relaxed text-ink-2"
            />

            {/* התאריך הלועזי לצד העברי — הקהל מנהל יומן עסקי לועזי */}
            <p className="mono-label mt-4 text-[12.5px] text-accent">
              {earlyBird.deadlineLabel} · {deadline.gregorianLabel}
            </p>
          </div>

          <OrderCta
            href="#order"
            className="brand-cta shine-cta inline-flex items-center justify-center px-7 py-4 text-base font-bold"
          >
            {earlyBird.cta}
          </OrderCta>
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   12 · מי עומד מאחורי "זמנים"?
   =============================================================== */

export function About({ content }: { content: SiteContentData }) {
  const { about } = content.landing;

  return (
    <section className="snap-section dark-zone border-b border-line-2">
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
          <SectionHead eyebrow={about.eyebrow} title={about.title} />

          <div className="grid content-start gap-4">
            {about.body.map((paragraph, index) => (
              <Prose
                key={index}
                text={paragraph}
                className="text-[16.5px] leading-relaxed text-ink-2"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   13 · שאלות — אקורדיון, לא קיר טקסט
   =============================================================== */

export function FAQ({ content }: { content: SiteContentData }) {
  if (content.faq.items.length === 0) return null;
  const { faq } = content.landing;

  return (
    <section id="faq" className="snap-section scroll-mt-20 border-b border-line-2">
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHead eyebrow={faq.eyebrow} title={faq.title} />

        <div className="mt-10 grid gap-px border border-line-2 bg-line-2">
          {content.faq.items.map((item, index) => (
            <details key={index} className="group bg-canvas px-6 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[16.5px] font-bold text-ink marker:content-none">
                {item.question}
                <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-300 ease-smooth group-open:rotate-180 group-open:text-accent" />
              </summary>

              <Prose
                text={item.answer}
                className="mt-3.5 max-w-3xl text-[15px] leading-relaxed text-ink-2"
              />

              {item.cta ? (
                <a
                  href="#contact"
                  className="mt-4 inline-flex items-center gap-2 border border-line-2 px-5 py-2.5 text-[14px] font-bold text-ink transition-colors duration-200 ease-smooth hover:bg-surface-2"
                >
                  {item.cta}
                  <ArrowLeft className="size-3.5" />
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
   14 · הנעה סופית
   =============================================================== */

export function FinalCta({ content }: { content: SiteContentData }) {
  const { finalCta } = content.landing;

  return (
    <section className="snap-section dark-zone border-b border-line-2">
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <h2 className="max-w-4xl font-display text-[2.2rem] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-[2.8rem]">
          {finalCta.title}
          <span className="gradient-num mt-2 block">{finalCta.subtitle}</span>
        </h2>

        <p className="mt-6 max-w-3xl text-[16.5px] leading-relaxed text-ink-2">
          {finalCta.body}
        </p>

        <Prose
          text={finalCta.ask}
          className="mt-5 max-w-3xl text-lg font-medium leading-relaxed text-ink"
        />

        <div className="mt-9 flex w-max max-w-full flex-wrap items-stretch border border-line-2">
          <OrderCta
            href="#order"
            className="brand-cta shine-cta inline-flex items-center px-7 py-4 text-base font-bold"
          >
            {finalCta.primaryCta}
          </OrderCta>
          <a
            href="#contact"
            className="inline-flex items-center border-s border-line-2 px-6 py-4 text-base font-medium text-ink transition-colors duration-200 ease-smooth hover:bg-surface-2"
          >
            {finalCta.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   18 · פוטר
   =============================================================== */

export function SiteFooter({ content }: { content: SiteContentData }) {
  const { footer } = content.landing;

  return (
    <footer className="dark-zone border-t border-line-2 pb-20 lg:pb-0">
      <div className="progress-fill h-[3px]" />

      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 sm:grid-cols-[1.4fr_1fr] lg:px-8">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/zmanim-logo-2.png"
            alt={content.brand.siteName}
            className="h-16 w-auto object-contain object-right"
          />
          <p className="mt-3 font-display text-lg font-extrabold tracking-tight text-ink">
            {footer.tagline}
          </p>
          <p className="mt-2.5 max-w-[38ch] text-[14.5px] leading-relaxed text-ink-2">
            {content.footer.note}
          </p>
        </div>

        <div className="grid content-start gap-2 sm:justify-items-end">
          <span className="mono-label text-[11.5px] text-ink-2 opacity-70">
            יצירת קשר
          </span>
          <a
            dir="ltr"
            href={`mailto:${content.contact.email}`}
            className="text-[15px] text-ink transition-colors hover:text-accent"
          >
            {content.contact.email}
          </a>
          <span dir="ltr" className="mono-label text-[14px] text-ink-2">
            {content.contact.phone}
          </span>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px]">
            {footer.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-ink underline underline-offset-4 transition-colors hover:text-accent"
              >
                {link.label}
              </a>
            ))}

            {/* מדיניות פרטיות מוצגת רק כשיש לאן לקשר — קישור שבור
                בפוטר גרוע מקישור חסר */}
            {footer.privacyHref ? (
              <a
                href={footer.privacyHref}
                className="text-ink underline underline-offset-4 transition-colors hover:text-accent"
              >
                {footer.privacyLabel}
              </a>
            ) : null}

            <a
              href="#order"
              className="text-ink underline underline-offset-4 transition-colors hover:text-accent"
            >
              {footer.tosLabel}
            </a>
          </div>

          {/* קוני הלוח מגיעים לכאן מהלוח המודפס עצמו, אבל מי שנחת
              קודם באתר צריך גם הוא דרך למצוא את הטופס */}
          <a
            href="/receipts"
            className="mt-2 text-[14px] text-ink underline underline-offset-4 transition-colors hover:text-accent"
          >
            קניתם אצל עסק מהלוח? להעלאת קבלה להגרלה
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-5 lg:px-8">
        <span className="mono-label text-[11.5px] text-ink-2 opacity-70">
          © 2026 {content.brand.siteName}
        </span>
      </div>
    </footer>
  );
}

import Image from "next/image";
import { ArrowLeft, Calendar, ChevronDown, MapPin, MoveHorizontal, Sparkles, type LucideIcon } from "lucide-react";
import { Eyebrow } from "@/components/ui/primitives";
import { CountUpStat } from "./CountUpStat";
import type { SiteContentData } from "@/lib/content";

const HIGHLIGHT_ICONS: Record<string, LucideIcon> = {
  calendar: Calendar,
  "map-pin": MapPin,
};

/** מפצל את כותרת ההירו למשפטים לפי נקודה, עם הנקודה חזרה בסוף כל אחד */
function splitHeroTitle(title: string): string[] {
  const parts = title
    .split(". ")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.map((s, i) => (i < parts.length - 1 ? `${s}.` : s));
}

export function Hero({ content }: { content: SiteContentData }) {
  const sentences = splitHeroTitle(content.hero.title);
  // משפט ראשון דומם; משפטים אמצעיים מקבלים גרדיאנט המותג + פעימה
  // ("רגע זהות" ספציפי, לפי חוק הגרדיאנט); המשפט האחרון תמיד עובר
  // לשורה חדשה — בלי לצייר ידנית מקרים לפי מספר הנקודות בטקסט.
  const stillPart = sentences[0] ?? "";
  const accentPart =
    sentences.length >= 2 ? sentences.slice(1, -1).join(" ") : "";
  const lastLinePart = sentences.length >= 2 ? sentences[sentences.length - 1] : "";

  return (
    <section className="snap-section dark-zone relative overflow-hidden border-b border-line-2">
      <div className="hero-glow" aria-hidden />

      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 px-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        {/* --- טקסט --- */}
        <div className="border-line-2 py-14 lg:border-e lg:py-20 lg:pe-12">
          <div className="mb-7 flex items-center gap-3.5 animate-[fade-up_0.5s_var(--ease-out-soft)_both]">
            <span className="progress-rule w-14" />
            <span className="mono-label text-[12.5px] text-ink-2">
              {content.hero.eyebrow}
            </span>
          </div>

          <h1
            className="display-hero text-ink animate-[fade-up_0.5s_var(--ease-out-soft)_60ms_both]"
          >
            {stillPart}
            {accentPart ? (
              <>
                {" "}
                <span
                  className="gradient-num inline-block"
                  style={{ animation: "hero-pulse 1.6s ease-in-out 0.6s infinite" }}
                >
                  {accentPart}
                </span>
              </>
            ) : null}
            {lastLinePart ? (
              <span className="mt-1 block text-[0.5em] leading-tight">
                {lastLinePart}
              </span>
            ) : null}
          </h1>

          <p
            className="mt-7 max-w-xl text-lg leading-relaxed text-ink-2 animate-[fade-up_0.5s_var(--ease-out-soft)_both]"
            style={{ animationDelay: "130ms" }}
          >
            {content.hero.subtitle}
          </p>

          <div
            className="mt-10 flex w-max flex-wrap items-stretch border border-line-2 animate-[fade-up_0.5s_var(--ease-out-soft)_both]"
            style={{ animationDelay: "200ms" }}
          >
            <a
              href="#order"
              className="brand-cta shine-cta inline-flex items-center px-8 py-4 text-base font-bold"
            >
              {content.hero.primaryCta}
            </a>

            <a
              href="#how"
              className="inline-flex items-center border-s border-line-2 px-6 py-4 text-base font-medium text-ink transition-colors duration-200 ease-smooth hover:bg-surface-2"
            >
              {content.hero.secondaryCta}
            </a>
          </div>

          {content.hero.stats.length > 0 ? (
            <dl
              className="mt-12 flex flex-wrap gap-x-10 gap-y-6 border-t border-line pt-7 animate-[fade-up_0.5s_var(--ease-out-soft)_both]"
              style={{ animationDelay: "260ms" }}
            >
              {content.hero.stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="mono-label text-[11px] text-ink-2">
                    {stat.label}
                  </dt>
                  <dd className="mt-1.5 text-2xl font-black leading-none text-ink">
                    <CountUpStat value={stat.value} />
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {/* --- דוגמה חיה לגיליון מלא מודעות --- */}
        <div className="flex items-center justify-center py-10 lg:py-20 lg:ps-12">
          <div
            className="animate-[fade-up_0.7s_var(--ease-out-soft)_both]"
            style={{ animationDelay: "180ms" }}
          >
            <Image
              src="/brand/hero-preview.png"
              alt="דוגמה לגיליון עם מודעות מפרסמים"
              width={880}
              height={1187}
              priority
              className="h-auto w-full max-w-[300px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Highlights({ content }: { content: SiteContentData }) {
  if (content.highlights.length === 0) return null;

  return (
    <section id="work" className="snap-section border-b border-line-2 scroll-mt-20">
      <div className="mx-auto max-w-[1200px] px-5 pt-16 lg:px-8">
        <div className="grid gap-10 border-b border-line pb-10 lg:grid-cols-[320px_1fr]">
          <h2 className="font-display text-[2.1rem] font-black leading-[1.08] tracking-tight text-ink">
            למה לוח שנה מנצח
            <br />
            כל פרסום אחר?
          </h2>
          <p className="self-end text-lg leading-relaxed text-ink-2">
            {content.brand.tagline}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-3">
          {content.highlights.map((item, index) => {
            const Icon = HIGHLIGHT_ICONS[item.icon] ?? Sparkles;
            return (
              <article
                key={index}
                className={[
                  "card-shape group relative overflow-hidden border border-line-2 bg-surface p-7",
                  "transition-[transform,border-color] duration-300 ease-smooth",
                  "hover:-translate-y-1.5 hover:scale-[1.02] hover:border-accent",
                  "hover:[animation:card-pulse_1.8s_ease-in-out_infinite]",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className="gradient-num pointer-events-none absolute -left-2 -top-6 font-display text-8xl font-black opacity-[0.14]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="relative flex items-center justify-between">
                  <span className="mono-label text-sm text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Icon
                    className="size-5 text-muted transition-[color,transform] duration-300 ease-smooth group-hover:scale-110 group-hover:text-accent"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="relative mt-6 font-display text-xl font-extrabold tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="relative mt-2.5 text-[15px] leading-relaxed text-ink-2">
                  {item.text}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks({ content }: { content: SiteContentData }) {
  if (content.howItWorks.length === 0) return null;

  return (
    <section id="how" className="snap-section dark-zone scroll-mt-20">
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <Eyebrow>התהליך</Eyebrow>
        <h2 className="mt-3 font-display text-[2.1rem] font-black leading-tight tracking-tight text-ink">
          4 צעדים — והמודעה שלכם על הקיר
        </h2>

        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-2">
          <MoveHorizontal className="size-3.5 shrink-0" />
          גררו לצדדים כדי לעבור בין השלבים
        </p>

        {/* קרוסלה אופקית עם snap — כל גלילה מביאה את הכרטיס הבא
            במלואו, בלי לצופף כמה כרטיסים צרים זה לצד זה. */}
        <ol
          className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {content.howItWorks.map((step, index) => (
            <li
              key={index}
              className={[
                "chevron-shape group relative w-[82%] shrink-0 snap-center overflow-hidden border border-line-2 bg-surface py-6 pl-8 pr-6",
                "sm:w-[58%] lg:w-[calc(25%-1.125rem)]",
                "transition-[transform,border-color] duration-300 ease-smooth",
                "hover:-translate-y-1.5 hover:scale-[1.02] hover:border-accent",
                "hover:[animation:card-pulse_1.8s_ease-in-out_infinite]",
              ].join(" ")}
            >
              <span
                aria-hidden
                className="gradient-num pointer-events-none absolute right-1 -top-7 font-display text-8xl font-black opacity-[0.16]"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <span
                className="relative mono-label block text-[13px]"
                style={{ color: "var(--color-brand-orange)" }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="relative mt-3 font-display text-lg font-extrabold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="relative mt-2 text-[15px] leading-relaxed text-ink-2">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}


export function FAQ({ content }: { content: SiteContentData }) {
  if (content.faq.items.length === 0) return null;

  const whatsappDigits = content.contact.whatsapp?.replace(/\D/g, "");
  const contactHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}`
    : `tel:${content.contact.phone}`;
  const contactLabel = whatsappDigits ? "בוואטסאפ" : `בטלפון ${content.contact.phone}`;

  return (
    <section id="faq" className="snap-section border-b border-line-2 scroll-mt-20">
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="border-b border-line pb-10">
          <Eyebrow>שאלות נפוצות</Eyebrow>
          <h2 className="mt-3 font-display text-[2.1rem] font-black leading-tight tracking-tight text-ink">
            עוד לפני שסוגרים
          </h2>
        </div>

        <div className="mt-8 grid gap-3">
          {content.faq.items.map((item, index) => (
            <details
              key={index}
              className="group card-shape shine-cta border border-line-2 bg-surface px-6 py-4 open:border-accent"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[16.5px] font-bold text-ink marker:content-none">
                {item.question}
                <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-300 ease-smooth group-open:rotate-180 group-open:text-accent" />
              </summary>
              <p className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-ink-2">
                {item.answer}
              </p>
            </details>
          ))}

          {/* "עוד שאלה?" — סוגר את הרשימה באותה שורת אקורדיון בדיוק,
              עם אותו אפקט ברק ב-hover כמו כפתור ה-CTA הראשי */}
          <a
            href={contactHref}
            className="group card-shape shine-cta flex items-center justify-between gap-4 border border-line-2 bg-surface px-6 py-4 font-display text-[16.5px] font-bold text-ink transition-colors duration-200 ease-smooth hover:border-accent"
          >
            יש לכם שאלה שלא מופיעה כאן? צרו איתנו קשר {contactLabel}
            <ArrowLeft className="size-4 shrink-0 text-muted transition-[transform,color] duration-300 ease-smooth group-hover:-translate-x-1 group-hover:text-accent" />
          </a>
        </div>
      </div>
    </section>
  );
}

export function SiteHeader({ content }: { content: SiteContentData }) {
  return (
    <header className="glass sticky top-0 z-30 border-b border-line-2">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-2.5 lg:px-8">
        <span dir="ltr" className="mono-label hidden text-[13px] text-ink-2 sm:block">
          {content.contact.phone}
        </span>

        {/* לוגו — נוכחות גדולה וממורכזת, כמו מסתהד עיתון */}
        <a href="/" className="flex flex-col items-center justify-self-center py-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.brand.logoUrl ?? "/brand/zmanim-logo.png"}
            alt={content.brand.siteName}
            className="h-11 w-auto max-w-56 object-contain sm:h-14"
          />
        </a>

        <div className="flex items-center justify-self-end gap-5">
          <a
            href="#order"
            className="brand-cta shine-cta inline-flex h-[38px] items-center px-5 text-[14px] font-bold"
          >
            להזמנה
          </a>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ content }: { content: SiteContentData }) {
  return (
    <footer className="dark-zone border-t border-line-2">
      <div className="progress-fill h-[3px]" />

      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 sm:grid-cols-[1.4fr_1fr] lg:px-8">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/zmanim-logo-2.png"
            alt={content.brand.siteName}
            className="h-16 w-auto object-contain object-right"
          />
          <p className="mt-3 max-w-[30ch] text-[14.5px] leading-relaxed text-ink-2">
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

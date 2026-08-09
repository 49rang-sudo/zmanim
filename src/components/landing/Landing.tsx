import Image from "next/image";
import { Eyebrow } from "@/components/ui/primitives";
import type { SiteContentData } from "@/lib/content";

export function Hero({ content }: { content: SiteContentData }) {
  return (
    <section className="dark-zone border-b border-line-2">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 px-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        {/* --- טקסט --- */}
        <div className="border-line-2 py-14 lg:border-e lg:py-20 lg:pe-12">
          <div className="mb-7 flex items-center gap-3.5 animate-[fade-up_0.5s_var(--ease-out-soft)_both]">
            <span className="progress-rule w-14" />
            <span className="mono-label text-[12.5px] text-ink-2">
              {content.hero.eyebrow}
            </span>
          </div>

          <h1
            className="display-hero text-ink animate-[fade-up_0.5s_var(--ease-out-soft)_both]"
            style={{ animationDelay: "60ms" }}
          >
            {content.hero.title}
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
              className="brand-cta inline-flex items-center px-8 py-4 text-base font-bold"
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
                  <dd className="tnum mt-1.5 text-2xl font-black leading-none text-ink">
                    {stat.value}
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
    <section id="work" className="border-b border-line-2 scroll-mt-20">
      <div className="mx-auto max-w-[1200px] px-5 pt-16 lg:px-8">
        <div className="grid gap-10 border-b border-line pb-10 lg:grid-cols-[320px_1fr]">
          <h2 className="font-display text-[2.1rem] font-black leading-[1.08] tracking-tight text-ink">
            למה מפרסמים
            <br />
            אצלנו
          </h2>
          <p className="self-end text-lg leading-relaxed text-ink-2">
            {content.brand.tagline}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-5 pb-16 lg:px-8">
        {content.highlights.map((item, index) => (
          <article
            key={index}
            className="grid grid-cols-[44px_1fr] items-baseline gap-6 border-t border-line py-6 transition-colors duration-200 ease-smooth hover:bg-surface-2 sm:grid-cols-[56px_220px_1fr] sm:gap-8"
          >
            <span className="mono-label text-sm text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display text-xl font-extrabold tracking-tight text-ink">
              {item.title}
            </h3>
            <p className="col-span-2 text-[15.5px] leading-relaxed text-ink-2 sm:col-span-1">
              {item.text}
            </p>
          </article>
        ))}
        <div className="border-t border-line" />
      </div>
    </section>
  );
}

export function HowItWorks({ content }: { content: SiteContentData }) {
  if (content.howItWorks.length === 0) return null;

  return (
    <section id="how" className="dark-zone scroll-mt-20">
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <Eyebrow>התהליך</Eyebrow>
        <h2 className="mt-3 font-display text-[2.1rem] font-black leading-tight tracking-tight text-ink">
          איך זה עובד
        </h2>

        <ol
          className="mt-12 grid gap-9 sm:grid-cols-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(content.howItWorks.length, 4)}, minmax(0,1fr))`,
          }}
        >
          {content.howItWorks.map((step, index) => (
            <li
              key={index}
              className="border-line ps-6 first:ps-0 sm:border-s sm:ps-7"
              style={{ borderInlineStartWidth: index === 0 ? 0 : undefined }}
            >
              <span className="mono-label text-[13px]" style={{ color: "var(--color-brand-orange)" }}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-lg font-extrabold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function SiteHeader({ content }: { content: SiteContentData }) {
  return (
    <header className="glass sticky top-0 z-30 border-b border-line-2">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[auto_1fr_auto] items-center gap-8 px-5 py-3.5 lg:px-8">
        <a href="/" className="flex items-center gap-2.5">
          {content.brand.logoUrl ? (
            // הלוגו של הלקוח גובר על סמל ברירת המחדל
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.brand.logoUrl}
              alt={content.brand.siteName}
              className="h-8 w-auto max-w-44 object-contain"
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/zmanim-mark.png"
                alt=""
                className="h-6 w-auto object-contain"
              />
              <span className="font-display text-lg font-black leading-tight tracking-tight text-ink">
                {content.brand.siteName}
              </span>
            </>
          )}
        </a>

        <span className="hidden justify-self-center text-[13.5px] text-ink-2 sm:block">
          {content.brand.tagline}
        </span>

        <div className="flex items-center gap-5">
          <span dir="ltr" className="mono-label hidden text-[13px] text-ink-2 sm:block">
            {content.contact.phone}
          </span>
          <a
            href="#order"
            className="brand-cta inline-flex h-[38px] items-center px-5 text-[14px] font-bold"
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
            src="/brand/zmanim-logo.png"
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

"use client";

/* ===============================================================
   1 · תפריט עליון — פורט מילולי של
   zmanim2-base44/src/components/zmanim/Navbar.jsx + Logo.jsx:
   סרגל שקוף שהופך לאטום (bg-background/85 + blur) אחרי גלילה,
   לוגו-שעון עם "זמנים", תפריט המבורגר במובייל, ובר CTA דביק
   בתחתית המסך במובייל. הכפתורים עצמם נשארים <OrderCta> אמיתי —
   לא onClick דמה כמו במוקאפ — כדי לשמור על ניווט אמיתי (גלילה
   לאשף, הודעת דרגה) ולא רק להעתיק מראה.
   =============================================================== */

import * as React from "react";
import { Menu, X } from "lucide-react";
import { OrderCta } from "./OrderCta";
import type { SiteContentData } from "@/lib/content";

function LogoMark({ siteName, logoUrl }: { siteName: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={siteName} className="h-9 w-auto max-w-40 object-contain" />
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="zh-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f17887" />
            <stop offset="100%" stopColor="#7a2a8e" />
          </linearGradient>
          <linearGradient id="zh-hands" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f2a265" />
            <stop offset="100%" stopColor="#f07c7f" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="16" fill="none" stroke="url(#zh-ring)" strokeWidth="3.2" />
        <line x1="20" y1="20" x2="20" y2="9" stroke="url(#zh-hands)" strokeWidth="3" strokeLinecap="round" />
        <line x1="20" y1="20" x2="29" y2="20" stroke="url(#zh-hands)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="20" cy="20" r="2.6" fill="#7a2a8e" />
      </svg>
      <span className="font-heading text-xl font-extrabold tracking-tight text-foreground">
        {siteName}
      </span>
    </div>
  );
}

export function SiteHeader({ content }: { content: SiteContentData }) {
  const { nav } = content.landing;
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-30 transition-colors ${
          scrolled ? "border-b border-border bg-background/85 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[120rem] items-center justify-between gap-4 px-5 lg:px-8">
          <a href="/" aria-label={content.brand.siteName}>
            <LogoMark siteName={content.brand.siteName} logoUrl={content.brand.logoUrl} />
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/75 transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <OrderCta
              href="#order"
              className="hidden h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-105 sm:inline-flex"
            >
              {nav.cta}
            </OrderCta>
            <button
              onClick={() => setOpen(true)}
              className="-mr-2 p-2 text-foreground lg:hidden"
              aria-label="פתח תפריט"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* תפריט מובייל במסך מלא */}
      {open ? (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <LogoMark siteName={content.brand.siteName} logoUrl={content.brand.logoUrl} />
            <button onClick={() => setOpen(false)} className="-mr-2 p-2" aria-label="סגור">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-5 px-6">
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-heading text-3xl font-bold text-foreground/85 transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="border-t border-border p-6">
            <OrderCta
              href="#order"
              className="flex h-12 w-full items-center justify-center rounded-full bg-primary font-bold text-primary-foreground"
            >
              {nav.cta}
            </OrderCta>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * כפתור קבוע בתחתית מסך המובייל — בקשה מפורשת בקופי (סעיף 1).
 * מוסתר במסכים גדולים, שם הכפתור בסרגל העליון ממילא תמיד גלוי.
 */
export function MobileCtaBar({ content }: { content: SiteContentData }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 p-3 backdrop-blur-md sm:hidden">
      <OrderCta
        href="#order"
        className="flex h-12 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-sm"
      >
        {content.landing.nav.mobileCta}
      </OrderCta>
    </div>
  );
}

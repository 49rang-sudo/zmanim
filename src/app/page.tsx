import type { Metadata } from "next";
import { getSiteSettings, getInspirationBoard } from "@/lib/site";
import { getLandingData } from "@/lib/landing";
import { resolveHebrewDeadline } from "@/lib/hebrew-date";
import { env } from "@/lib/env";
import { OrderWizard } from "@/components/wizard/OrderWizard";
import {
  About,
  Benefit,
  Difference,
  EarlyBird,
  FAQ,
  FinalCta,
  Hero,
  HowToJoin,
  MobileCtaBar,
  Pricing,
  SectionEyebrow,
  Showcase,
  SiteFooter,
  SiteHeader,
  WhatYouGet,
  WhyNotAnother,
} from "@/components/landing/Landing";
import { CalendarBrowser } from "@/components/landing/CalendarBrowser";
import { InquiryForm } from "@/components/landing/InquiryForm";
import { InquiryPopup } from "@/components/landing/InquiryPopup";

// זמינות משתנה כל הזמן — אסור להגיש את העמוד מהמטמון
export const dynamic = "force-dynamic";

/** 19 · כותרת דפדפן ותיאור לגוגל — מתוך התוכן הנערך, לא קשיח בקוד */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const { seo } = settings.content.landing;

  return {
    title: { absolute: seo.title },
    description: seo.description,
    openGraph: { title: seo.title, description: seo.description },
  };
}

export default async function HomePage() {
  const settings = await getSiteSettings();

  const [board, landing] = await Promise.all([
    getInspirationBoard(),
    getLandingData(settings.content.landing.months.cityName),
  ]);

  const e = env();
  const maxUploadMb = e.MAX_UPLOAD_MB;
  const sumitCompanyId = e.SUMIT_COMPANY_ID ?? null;
  const sumitApiPublicKey = e.SUMIT_API_PUBLIC_KEY ?? null;

  // 11 · הבונוס נבדק כאן, בשרת, מול לוח השנה העברי האמיתי. אזור
  // שההטבה שלו נגמרה לא מגיע לדפדפן בכלל — לא מוסתר ב-CSS.
  const { earlyBird } = settings.content.landing;
  const deadline = resolveHebrewDeadline(
    earlyBird.deadlineHebrewDay,
    earlyBird.deadlineHebrewMonth,
    earlyBird.deadlineHebrewYear,
  );

  const showLanding = settings.landingEnabled;

  return (
    <>
      <SiteHeader content={settings.content} />

      <main>
        {/* סדר הדף (3א, מסונכרן מול zmanim2-base44/src/pages/Home.jsx):
            הירו → הלוח/הבורר של החודשים + אשף ההזמנה (מיד אחריו, לפני
            כל סקשן הסבר) → ConceptGrid → Difference → WhyNotAnother →
            ...(שאר הסקשנים, ללא שינוי). אושר מראש על ידי הלקוחה. */}
        {showLanding ? (
          <>
            <Hero content={settings.content} />
            <CalendarBrowser
              content={settings.content}
              board={board}
              months={landing.months}
              editions={landing.editions}
            />
          </>
        ) : null}

        {/* אזור ההזמנה — הבורר האמיתי. כל כפתורי הבחירה בעמוד
            מובילים לכאן, ואין העתק שני שלו בשום מקום. */}
        <section
          id="order"
          className="scroll-mt-16 border-b border-border bg-background"
        >
          <div className="mx-auto max-w-[120rem] px-5 py-14 lg:px-8 sm:py-20">
            {showLanding ? (
              <div className="mb-10">
                <SectionEyebrow text={settings.content.landing.months.eyebrow} />
                <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                  {settings.content.wizard.chooseTitle}
                </h2>
              </div>
            ) : null}

            <OrderWizard
              board={board}
              content={settings.content}
              maxUploadMb={maxUploadMb}
              sumitCompanyId={sumitCompanyId}
              sumitApiPublicKey={sumitApiPublicKey}
            />
          </div>
        </section>

        {showLanding ? (
          <>
            <Showcase content={settings.content} data={landing} />
            <Difference content={settings.content} />
            <WhyNotAnother content={settings.content} />
            <WhatYouGet content={settings.content} />
            <Pricing content={settings.content} data={landing} />
            <Benefit content={settings.content} />
            <HowToJoin content={settings.content} />
            <EarlyBird content={settings.content} deadline={deadline} />
            <About content={settings.content} />
            <FAQ content={settings.content} />
            <FinalCta content={settings.content} />
            <InquiryForm content={settings.content} />
          </>
        ) : null}
      </main>

      <SiteFooter content={settings.content} />

      {showLanding ? (
        <>
          <InquiryPopup content={settings.content} />
          <MobileCtaBar content={settings.content} />
        </>
      ) : null}
    </>
  );
}

import type { Metadata } from "next";
import { getSiteSettings, getInspirationBoard } from "@/lib/site";
import { getLandingData } from "@/lib/landing";
import { resolveHebrewDeadline } from "@/lib/hebrew-date";
import { env } from "@/lib/env";
import { OrderModalHost } from "@/components/landing/OrderModalHost";
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
  Showcase,
  SiteFooter,
  SiteHeader,
  SocialProof,
  WhatYouGet,
  WhyNotAnother,
} from "@/components/landing/Landing";
import { CalendarBrowser } from "@/components/landing/CalendarBrowser";
import { InquiryForm } from "@/components/landing/InquiryForm";
import { InquiryPopup } from "@/components/landing/InquiryPopup";
import { DesktopCta } from "@/components/landing/DesktopCta";
import { InventoryStrip } from "@/components/landing/InventoryStrip";

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
            הירו → הלוח/הבורר של החודשים → "מה עוד פנוי עכשיו" →
            ConceptGrid → Difference → WhyNotAnother → ...(שאר
            הסקשנים, ללא שינוי). אושר מראש על ידי הלקוחה.

            אשף ההזמנה כבר לא קטע קבוע בעמוד (כמו ב-Base44 עם
            ReservationModal) — הוא נטען לפי דרישה בתוך מודל, דרך
            OrderModalHost למטה. שום כפתור בעמוד לא מצביע יותר
            ל-#order כקטע אמיתי — כולם עוברים דרך OrderCta /
            openOrderModal (src/lib/order-focus.ts). */}
        {showLanding ? (
          <>
            <Hero content={settings.content} />
            <CalendarBrowser
              content={settings.content}
              board={board}
              months={landing.months}
              editions={landing.editions}
            />

            {/* 4ג: "מה עוד פנוי עכשיו" — פורט מ-InventoryStrip.jsx.
                נשאר קטע קבוע בעמוד (בדיוק כמו ב-Base44): רק אשף
                ההזמנה עצמו עבר להיות מודל, לא הרשימה הזו. צורך את
                landing.months הקיים בלבד — אין חישוב זמינות חדש. */}
            <InventoryStrip months={landing.months} />
          </>
        ) : null}

        {/* מאחז מודל ההזמנה — מקבל בדיוק את מה שה-OrderWizard קיבל
            כשהיה קטע קבוע בעמוד, ונשאר מותקן תמיד (גם כש-showLanding
            כבוי), כי גם ה-OrderWizard המקורי תמיד עלה בעמוד ללא
            תלות ב-showLanding. */}
        <OrderModalHost
          board={board}
          content={settings.content}
          maxUploadMb={maxUploadMb}
          sumitCompanyId={sumitCompanyId}
          sumitApiPublicKey={sumitApiPublicKey}
        />

        {showLanding ? (
          <>
            <Showcase content={settings.content} data={landing} />
            <Difference content={settings.content} />
            <WhyNotAnother content={settings.content} />
            <SocialProof content={settings.content} />
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
          <DesktopCta content={settings.content} />
        </>
      ) : null}
    </>
  );
}

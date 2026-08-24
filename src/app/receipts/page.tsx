import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/site";
import { env } from "@/lib/env";
import { RECEIPT_MAX_MB } from "@/lib/receipts";
import { ReceiptUploader } from "@/components/receipts/ReceiptUploader";
import { SiteFooter, SiteHeader } from "@/components/landing/Landing";
import { Eyebrow } from "@/components/ui/primitives";

// מי מפרסם החודש משתנה כל הזמן — אסור להגיש את העמוד מהמטמון
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "העלאת קבלה להגרלה החודשית",
  description:
    "קניתם החודש אצל עסק שמפרסם בלוח? העלו את הקבלה והשתתפו בהגרלה על ההטבה שהעסק מציע.",
  // עמוד לקוני הלוח המודפס, לא יעד חיפוש — ההפניה מגיעה מהלוח עצמו
  robots: { index: false, follow: true },
};

export default async function ReceiptsPage() {
  const settings = await getSiteSettings();

  // המגבלה האפקטיבית: המוקדם מבין תקרת השרת הכללית לבין תקרת
  // הקבלות. הטופס בדפדפן והשרת חייבים להציג ולאכוף את אותו מספר.
  const maxUploadMb = Math.min(env().MAX_UPLOAD_MB, RECEIPT_MAX_MB);

  return (
    <>
      <SiteHeader content={settings.content} />

      <main>
        <section className="border-b border-line-2 bg-canvas">
          <div className="mx-auto max-w-[1200px] px-5 py-12 sm:py-16 lg:px-8">
            <Eyebrow>הגרלה חודשית</Eyebrow>

            <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-5xl">
              קניתם אצל עסק מהלוח? העלו את הקבלה
            </h1>

            <div className="progress-rule mt-5 w-24" />

            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-2 sm:text-base">
              כל עסק שמפרסם בלוח מציע הטבה לקונים שלו באותו חודש, ובסוף
              החודש מוגרלת ההטבה בין כל מי שקנה. כדי להשתתף צריך רק לבחור
              את העיר ואת העסק, לצרף את הקבלה ולהשאיר טלפון. אין הרשמה
              ואין צורך בחשבון.
            </p>
          </div>
        </section>

        <section className="bg-canvas">
          <div className="mx-auto max-w-[1200px] px-5 py-12 sm:py-16 lg:px-8">
            <ReceiptUploader maxUploadMb={maxUploadMb} />
          </div>
        </section>
      </main>

      <SiteFooter content={settings.content} />
    </>
  );
}

import { getSiteSettings, getActiveSlots } from "@/lib/site";
import { env } from "@/lib/env";
import { OrderWizard } from "@/components/wizard/OrderWizard";
import {
  Hero,
  Highlights,
  HowItWorks,
  SiteFooter,
  SiteHeader,
} from "@/components/landing/Landing";
import { Eyebrow } from "@/components/ui/primitives";

// זמינות משתנה כל הזמן — אסור להגיש את העמוד מהמטמון
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, slots] = await Promise.all([
    getSiteSettings(),
    getActiveSlots(),
  ]);

  const maxUploadMb = env().MAX_UPLOAD_MB;

  return (
    <>
      <SiteHeader content={settings.content} />

      <main>
        {/* עמוד הנחיתה ניתן לכיבוי מלוח הניהול — אז נכנסים ישר לאשף */}
        {settings.landingEnabled ? (
          <>
            <Hero content={settings.content} />
            <Highlights content={settings.content} />
            <HowItWorks content={settings.content} />
          </>
        ) : null}

        <section
          id="order"
          className="scroll-mt-16 border-t border-line bg-canvas"
        >
          <div className="mx-auto max-w-[1200px] px-5 py-14 sm:py-20">
            {settings.landingEnabled ? (
              <div className="mb-10">
                <Eyebrow>הזמנה</Eyebrow>
                <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
                  בחירת המשבצת שלכם
                </h2>
              </div>
            ) : null}

            <OrderWizard
              slots={slots}
              content={settings.content}
              maxUploadMb={maxUploadMb}
            />
          </div>
        </section>
      </main>

      <SiteFooter content={settings.content} />
    </>
  );
}

import type { Metadata, Viewport } from "next";
import { Heebo, Assistant, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap",
});

// גופן גוף חדש (זהות ה-reskin) — Heebo נשאר טעון כגיבוי/לרכיבים ישנים
const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-assistant",
  display: "swap",
});

// תוויות מונוספייס — eyebrows, מספור, זמנים. חלק מהזהות העיתונאית
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ZMANIM — הפרסום של העסק שלך בזמן הנכון",
    template: "%s · ZMANIM",
  },
  description:
    "בחרו גודל פרסום בלוח השנה המודפס, העלו קובץ מוכן לדפוס וסיימו את ההזמנה בתשלום מאובטח.",
  robots: { index: true, follow: true },
};

// כותרת/סרגל הדפדפן — קרם, כמו הקנבס הבהיר של רוב האתר
export const viewport: Viewport = {
  themeColor: "#F3EEE7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${assistant.variable} ${mono.variable}`}
    >
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster
          position="bottom-center"
          dir="rtl"
          toastOptions={{
            style: {
              background: "var(--color-ink)",
              color: "var(--color-canvas)",
              border: "none",
              fontFamily: "var(--font-body)",
            },
          }}
        />
      </body>
    </html>
  );
}

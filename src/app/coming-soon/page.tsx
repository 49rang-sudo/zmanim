export const dynamic = "force-static";

export default function ComingSoonPage() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "28px",
        padding: "24px",
        textAlign: "center",
        backgroundColor: "#f2efe9",
        color: "#17131f",
        fontFamily: "var(--font-heebo, 'Segoe UI', Arial, sans-serif)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/zmanim-logo.png"
        alt="זמנים"
        style={{ width: "160px", height: "auto" }}
      />
      <h1
        style={{
          fontSize: "clamp(1.7rem, 5vw, 2.6rem)",
          fontWeight: 800,
          maxWidth: "20ch",
          lineHeight: 1.25,
          margin: 0,
        }}
      >
        האתר כבר בדרך אליכם...
      </h1>
      <p
        style={{
          fontSize: "17px",
          lineHeight: 1.7,
          color: "#5a5266",
          maxWidth: "42ch",
          margin: 0,
        }}
      >
        אנחנו עובדים כרגע על השלמת הלוח. חוזרים בקרוב עם משהו יפה.
      </p>
    </div>
  );
}

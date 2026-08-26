/* שעון דקורטיבי בסגנון "זמנים" — קשת צבעונית ומחוג מסתובב לאט.
   פורטה כמעט-מילולית מ-zmanim2-base44/src/components/zmanim/ClockMark.jsx
   (מוקאפ Base44 של המעצבת). SVG טהור, ללא תלות בערכת הנושא —
   הצבעים קשיחים בכוונה, כמו ב-JSX המקורי. */
export function ClockMark({ className = "" }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 340 340">
        <defs>
          <linearGradient id="clockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C1367F" />
            <stop offset="100%" stopColor="#E2953B" />
          </linearGradient>
        </defs>
        <circle cx="170" cy="170" r="150" fill="none" stroke="rgba(23,19,15,.08)" strokeWidth="2" />
        <circle
          cx="170"
          cy="170"
          r="150"
          fill="none"
          stroke="url(#clockGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="820"
          strokeDashoffset="230"
        />
        <g className="clock-hand" stroke="#17130F" strokeWidth="4" strokeLinecap="round">
          <line x1="170" y1="170" x2="170" y2="76" />
        </g>
        <circle cx="170" cy="170" r="7" fill="#17130F" />
      </svg>
    </div>
  );
}

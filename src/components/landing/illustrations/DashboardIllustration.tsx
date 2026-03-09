const DashboardIllustration = ({ className = "" }: { className?: string }) => {
  const s = {
    stroke: "hsl(var(--illustration))",
    strokeWidth: 0.4,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="100 80 200 260" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M115 110 L285 110" style={s} />
      <path d="M125 97 L175 97" style={s} />
      <path d="M271 99 C271 95 273 91 275 91 C277 91 279 95 279 99 L279 100 C281 100.5 282 101.5 282 103 L268 103 C268 101.5 269 100.5 271 100 Z" style={s} />
      <path d="M273 103 C273 104.5 274 105.5 275 105.5 C276 105.5 277 104.5 277 103" style={s} />
      <circle cx="280" cy="92" r="2" style={{ ...s, fill: "hsl(var(--illustration))" }} />
      <rect x="125" y="120" width="150" height="45" rx="4" style={s} />
      <line x1="135" y1="133" x2="175" y2="133" style={s} />
      <line x1="135" y1="145" x2="195" y2="145" style={s} />
      <line x1="135" y1="155" x2="165" y2="155" style={s} />
      <circle cx="265" cy="142" r="5" style={s} />
      <rect x="125" y="175" width="150" height="45" rx="4" style={s} />
      <line x1="135" y1="188" x2="180" y2="188" style={s} />
      <line x1="135" y1="200" x2="200" y2="200" style={s} />
      <line x1="135" y1="210" x2="160" y2="210" style={s} />
      <circle cx="265" cy="197" r="5" style={s} />
      <rect x="125" y="230" width="150" height="45" rx="4" style={s} />
      <line x1="135" y1="243" x2="170" y2="243" style={s} />
      <line x1="135" y1="255" x2="190" y2="255" style={s} />
      <line x1="135" y1="265" x2="155" y2="265" style={s} />
      <circle cx="265" cy="252" r="5" style={s} />
      <rect x="125" y="285" width="150" height="45" rx="4" style={s} />
      <line x1="135" y1="298" x2="168" y2="298" style={s} />
      <line x1="135" y1="310" x2="185" y2="310" style={s} />
      <circle cx="265" cy="305" r="5" style={s} />
    </svg>
  );
};

export default DashboardIllustration;

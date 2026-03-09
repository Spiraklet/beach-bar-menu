const BeachSceneIllustration = ({ className = "" }: { className?: string }) => {
  const s = {
    stroke: "hsl(var(--section-dark-foreground))",
    strokeWidth: 0.7,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 500 500" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="250" y1="120" x2="250" y2="420" style={s} />
      <path d="M150 130 C150 50 250 20 250 20 C250 20 350 50 350 130" style={s} />
      <path d="M150 130 L350 130" style={s} />
      <line x1="200" y1="70" x2="200" y2="130" style={s} />
      <line x1="300" y1="70" x2="300" y2="130" style={s} />
      <path d="M100 380 L220 380 L245 345 L235 345 L215 375 L105 375 L75 320 L85 318 Z" style={s} />
      <line x1="100" y1="380" x2="95" y2="420" style={s} />
      <line x1="220" y1="380" x2="225" y2="420" style={s} />
      <path d="M280 380 L400 380 L425 345 L415 345 L395 375 L285 375 L255 320 L265 318 Z" style={s} />
      <line x1="280" y1="380" x2="275" y2="420" style={s} />
      <line x1="400" y1="380" x2="405" y2="420" style={s} />
      <circle cx="400" cy="60" r="30" style={s} />
      <line x1="400" y1="18" x2="400" y2="5" style={s} />
      <line x1="400" y1="103" x2="400" y2="116" style={s} />
      <line x1="358" y1="60" x2="345" y2="60" style={s} />
      <line x1="442" y1="60" x2="455" y2="60" style={s} />
      <line x1="379" y1="39" x2="370" y2="30" style={s} />
      <line x1="421" y1="81" x2="430" y2="90" style={s} />
      <line x1="421" y1="39" x2="430" y2="30" style={s} />
      <line x1="379" y1="81" x2="370" y2="90" style={s} />
      <path d="M80 420 C85 340 75 260 95 180" style={s} />
      <path d="M95 180 C70 155 40 165 15 185" style={s} />
      <path d="M95 180 C90 150 65 138 40 145" style={s} />
      <path d="M95 180 C115 155 145 160 165 180" style={s} />
      <path d="M95 180 C110 150 135 145 160 152" style={s} />
      <path d="M95 180 C98 150 92 125 78 110" style={s} />
      <rect x="320" y="300" width="45" height="4" rx="2" style={s} />
      <line x1="332" y1="304" x2="328" y2="370" style={s} />
      <line x1="355" y1="304" x2="359" y2="370" style={s} />
      <path d="M335 282 L340 300 L355 300 L360 282" style={s} />
      <line x1="335" y1="282" x2="360" y2="282" style={s} />
      <line x1="347" y1="260" x2="342" y2="295" style={s} />
      <circle cx="360" cy="278" r="8" style={s} />
      <path d="M0 450 C30 442 55 458 85 450 C115 442 140 458 170 450 C200 442 225 458 255 450 C285 442 310 458 340 450 C370 442 395 458 425 450 C455 442 480 458 500 450" style={s} />
      <path d="M0 465 C35 458 60 472 90 465 C120 458 145 472 175 465 C205 458 230 472 260 465 C290 458 315 472 345 465 C375 458 400 472 430 465 C460 458 485 472 500 465" style={s} />
      <path d="M0 478 C25 472 55 485 85 478 C115 472 145 485 175 478 C205 472 235 485 265 478 C295 472 325 485 355 478 C385 472 415 485 445 478 C475 472 490 485 500 478" style={s} />
      <path d="M300 30 C305 24 310 24 315 28" style={s} />
      <path d="M330 18 C335 12 340 12 345 16" style={s} />
      <path d="M350 35 C355 30 360 30 365 33" style={s} />
    </svg>
  );
};

export default BeachSceneIllustration;

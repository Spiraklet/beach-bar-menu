const QRPhoneIllustration = ({ className = "" }: { className?: string }) => {
  const s = {
    stroke: "hsl(var(--illustration))",
    strokeWidth: 0.7,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 -25 400 505" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="200" y1="80" x2="200" y2="460" style={s} />
      <path d="M50 90 C50 20 125 -20 200 -20 C275 -20 350 20 350 90" style={s} />
      <path d="M50 90 C70 105 90 108 125 90" style={s} />
      <path d="M125 90 C150 108 170 108 200 90" style={s} />
      <path d="M200 90 C230 108 250 108 275 90" style={s} />
      <path d="M275 90 C305 108 330 105 350 90" style={s} />
      <path d="M125 20 L125 90" style={s} />
      <path d="M200 -20 L200 90" style={s} />
      <path d="M275 20 L275 90" style={s} />
      <path d="M88 50 C110 42 140 42 162 50" style={s} />
      <path d="M162 50 C180 42 220 42 238 50" style={s} />
      <path d="M238 50 C258 42 290 42 312 50" style={s} />
      <path d="M185 420 L215 420" style={s} />
      <path d="M175 440 L225 440" style={s} />
      <path d="M30 460 C80 455 320 455 370 460" style={s} />
      <path d="M60 468 C90 465 130 464 160 466" style={s} />
      <path d="M240 466 C280 464 320 465 350 468" style={s} />
      <path d="M270 420 L295 395 L345 395" style={s} />
      <path d="M270 420 L345 420" style={s} />
      <path d="M295 395 L280 460" style={s} />
      <path d="M345 395 L335 460" style={s} />
      <path d="M345 420 L350 460" style={s} />
      <path d="M297 393 C305 385 325 383 343 393" style={s} />
      <path d="M60 430 L120 430" style={s} />
      <line x1="75" y1="430" x2="72" y2="460" style={s} />
      <line x1="105" y1="430" x2="108" y2="460" style={s} />
      <path d="M82 420 L85 430" style={s} />
      <path d="M98 420 L95 430" style={s} />
      <path d="M82 420 L98 420" style={s} />
      <line x1="90" y1="412" x2="90" y2="420" style={s} />
      <circle cx="90" cy="409" r="4" style={s} />
      <path d="M40 420 L65 395 L115 395" style={s} />
      <path d="M40 420 L115 420" style={s} />
      <path d="M65 395 L50 460" style={s} />
      <path d="M115 420 L120 460" style={s} />
      <path d="M60 140 C65 135 70 135 75 140" style={s} />
      <path d="M320 130 C325 125 330 125 335 130" style={s} />
      <path d="M340 150 C343 147 346 147 349 150" style={s} />
      <path d="M375 75 L377 69 L379 75 L385 77 L379 79 L377 85 L375 79 L369 77 Z" style={s} />
      <path d="M42 120 L43.5 115 L45 120 L50 121.5 L45 123 L43.5 128 L42 123 L37 121.5 Z" style={s} />
    </svg>
  );
};

export default QRPhoneIllustration;

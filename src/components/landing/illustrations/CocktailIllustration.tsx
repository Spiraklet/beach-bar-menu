const CocktailIllustration = ({ className = "" }: { className?: string }) => {
  const s = {
    stroke: "hsl(var(--illustration))",
    strokeWidth: 0.7,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 400 500" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <line x1="130" y1="110" x2="270" y2="110" style={s} />
      <path d="M130 110 C125 140 128 180 155 215 C170 232 185 238 200 240 C215 238 230 232 245 215 C272 180 275 140 270 110" style={s} />
      <path d="M140 170 C155 200 175 215 200 218 C225 215 245 200 260 170" style={s} />
      <path d="M200 240 C198 275 197 315 200 360" style={s} />
      <ellipse cx="200" cy="365" rx="50" ry="10" style={s} />
      <rect x="175" y="140" width="18" height="16" rx="3" style={s} transform="rotate(-8 184 148)" />
      <rect x="200" y="135" width="18" height="16" rx="3" style={s} transform="rotate(12 209 143)" />
      <rect x="185" y="160" width="16" height="14" rx="3" style={s} transform="rotate(-5 193 167)" />
      <circle cx="170" cy="180" r="2.5" style={s} />
      <circle cx="185" cy="165" r="2" style={s} />
      <circle cx="220" cy="175" r="2" style={s} />
      <circle cx="230" cy="155" r="1.8" style={s} />
      <circle cx="195" cy="190" r="1.5" style={s} />
      <circle cx="210" cy="145" r="2" style={s} />
      <path d="M262 108 C272 95 288 93 293 103 C298 113 288 123 278 123 C270 123 264 117 262 108Z" style={s} />
      <path d="M270 100 L285 115" style={s} />
      <path d="M278 97 L288 110" style={s} />
      <line x1="270" y1="110" x2="262" y2="108" style={s} />
      <path d="M55 340 C55 360 70 375 95 375 C120 375 135 360 135 340" style={s} />
      <path d="M50 340 L140 340" style={s} />
      <circle cx="75" cy="332" r="5" style={s} />
      <circle cx="90" cy="328" r="6" style={s} />
      <circle cx="107" cy="331" r="5" style={s} />
      <circle cx="82" cy="322" r="4" style={s} />
      <circle cx="98" cy="320" r="4.5" style={s} />
      <circle cx="112" cy="325" r="3.5" style={s} />
      <circle cx="70" cy="326" r="3" style={s} />
      <path d="M310 100 L312 94 L314 100 L320 102 L314 104 L312 110 L310 104 L304 102 Z" style={s} />
      <path d="M95 120 L96.5 115 L98 120 L103 121.5 L98 123 L96.5 128 L95 123 L90 121.5 Z" style={s} />
      <path d="M320 240 L321 236 L322 240 L326 241 L322 242 L321 246 L320 242 L316 241 Z" style={s} />
    </svg>
  );
};

export default CocktailIllustration;

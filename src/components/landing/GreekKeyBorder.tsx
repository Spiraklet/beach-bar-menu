interface GreekKeyBorderProps {
  className?: string;
  color?: string;
}

const GreekKeyBorder = ({ className = "", color = "hsl(var(--primary))" }: GreekKeyBorderProps) => {
  const unitW = 20;
  const count = 60;
  const w = unitW * count;
  const h = 10;

  let d = `M0 ${h}`;
  for (let i = 0; i < count; i++) {
    const x = i * unitW;
    d += ` L${x} 0 L${x + 14} 0 L${x + 14} 6 L${x + 6} 6 L${x + 6} 4 L${x + 10} 4 L${x + 10} 2 L${x + 4} 2 L${x + 4} 8 L${x + 16} 8 L${x + 16} 2 L${x + 18} 2 L${x + 18} ${h} L${x + 20} ${h}`;
  }

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid slice"
        className="w-full block h-2 sm:h-2.5 md:h-3 lg:h-4"
      >
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="0.6"
          strokeLinejoin="miter"
        />
      </svg>
    </div>
  );
};

export default GreekKeyBorder;

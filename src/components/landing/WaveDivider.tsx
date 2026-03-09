'use client';

import { useId } from "react";

interface WaveDividerProps {
  topColor: string;
  bottomColor: string;
  strokeColor?: string;
  className?: string;
}

const WaveDivider = ({ topColor, bottomColor, strokeColor, className = "" }: WaveDividerProps) => {
  const stroke = strokeColor || bottomColor;
  const id = useId();

  const unitW = 40;
  const h = 34;
  const mid = 17;
  const top = 5;

  const repeats = 50;
  const totalW = unitW * repeats;

  let fullPath = "";
  for (let i = 0; i < repeats; i++) {
    const ox = i * unitW;
    fullPath += `M${ox} ${mid}`;
    fullPath += ` C${ox + 5} ${mid - 3} ${ox + 7.5} ${top + 2.5} ${ox + 12.5} ${top}`;
    fullPath += ` C${ox + 22.5} ${top - 1.5} ${ox + 30} ${top + 5} ${ox + 30} ${mid - 2.5}`;
    fullPath += ` C${ox + 30} ${mid + 6} ${ox + 22.5} ${mid + 9} ${ox + 16} ${mid + 7.5}`;
    fullPath += ` C${ox + 11} ${mid + 6} ${ox + 10} ${mid + 1} ${ox + 12.5} ${mid - 2.5}`;
    fullPath += ` C${ox + 14.5} ${mid - 5} ${ox + 19} ${mid - 6} ${ox + 21.5} ${mid - 4}`;
    fullPath += ` C${ox + 23.5} ${mid - 2.5} ${ox + 23} ${mid} ${ox + 21} ${mid + 1}`;
    fullPath += ` C${ox + 19.5} ${mid + 2} ${ox + 18} ${mid + 1} ${ox + 18} ${mid}`;
    fullPath += ` M${ox + 30} ${mid - 2.5}`;
    fullPath += ` C${ox + 31} ${mid + 2.5} ${ox + 35} ${mid + 1} ${ox + unitW} ${mid}`;
  }

  return (
    <div className={`relative w-full ${className}`} style={{ marginTop: -1, marginBottom: -1 }}>
      <svg
        viewBox={`0 0 ${totalW} ${h}`}
        preserveAspectRatio="xMidYMid slice"
        className="block w-full h-4 sm:h-5 md:h-6"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={totalW} height={h} fill={topColor} />
        <path
          d={fullPath}
          fill="none"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default WaveDivider;

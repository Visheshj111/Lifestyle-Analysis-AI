import { useEffect, useRef, useState } from "react";

interface CircularProgressProps {
  value: number; // 0-100
  size?: number; // px
  strokeWidth?: number; // px
  color?: string; // tailwind color class or hex
}

export default function CircularProgress({ value, size = 160, strokeWidth = 12, color = "#14b8a6" }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const to = Math.max(0, Math.min(100, value));
    const duration = 800;

    const tick = (t: number) => {
      const progress = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const dashOffset = circumference * (1 - display / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e6f7f5" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 200ms linear" }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-teal-700" style={{ fontSize: size * 0.22, fontWeight: 700 }}>
        {Math.round(display)}%
      </text>
    </svg>
  );
}

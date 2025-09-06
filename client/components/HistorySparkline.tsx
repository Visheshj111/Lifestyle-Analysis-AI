import React from "react";

interface HistorySparklineProps {
  values: number[]; // 0-100
  width?: number;
  height?: number;
}

export default function HistorySparkline({
  values,
  width = 160,
  height = 40,
}: HistorySparklineProps) {
  const max = 100;
  const n = values.length || 1;
  const step = width / Math.max(1, n - 1);
  const points = values
    .map((v, i) => `${i * step},${height - (v / max) * height}`)
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label="Weekly score sparkline"
    >
      <polyline fill="none" stroke="#14b8a6" strokeWidth="2" points={points} />
      {values.map((v, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={height - (v / max) * height}
          r={2}
          fill="#14b8a6"
        />
      ))}
    </svg>
  );
}

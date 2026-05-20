export function Sparkline({
  values,
  width = 56,
  height = 18,
  className = "",
}: {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (values.length < 2) {
    return (
      <span
        aria-hidden
        className={`inline-block rounded-sm ${className}`}
        style={{ width, height }}
      />
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const stepX = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`block overflow-visible ${className}`}
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.7}
      />
      <circle cx={last[0]} cy={last[1]} r={2} fill="currentColor" />
    </svg>
  );
}

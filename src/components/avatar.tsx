const PALETTE = [
  // warm-themed palette, tuned for white text contrast
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-pink-500",
  "bg-fuchsia-500",
  "bg-yellow-600",
  "bg-orange-600",
  "bg-rose-600",
  "bg-red-600",
] as const;

function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h);
}

type Size = "xs" | "sm" | "md" | "lg" | "xl";
const sizeClass: Record<Size, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  size = "md",
  className = "",
  dim = false,
}: {
  name: string;
  size?: Size;
  className?: string;
  dim?: boolean;
}) {
  const color = PALETTE[hash(name) % PALETTE.length];
  return (
    <span
      aria-label={name}
      title={name}
      className={`inline-flex items-center justify-center rounded-full font-heading font-bold text-white shadow-sm ring-2 ring-background ${color} ${
        sizeClass[size]
      } ${dim ? "opacity-50" : ""} ${className}`}
    >
      {initials(name)}
    </span>
  );
}

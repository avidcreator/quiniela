const PALETTE = [
  // monochrome scale — Nike-style, no chromatic variation
  "bg-zinc-900",
  "bg-zinc-800",
  "bg-zinc-700",
  "bg-neutral-900",
  "bg-neutral-700",
  "bg-stone-900",
  "bg-stone-700",
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
  imageUrl,
  size = "md",
  className = "",
  dim = false,
}: {
  name: string;
  imageUrl?: string | null;
  size?: Size;
  className?: string;
  dim?: boolean;
}) {
  const base = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full align-middle font-heading font-bold text-white shadow-sm ring-2 ring-background ${sizeClass[size]} ${dim ? "opacity-50" : ""} ${className}`;

  if (imageUrl) {
    return (
      <span
        aria-label={name}
        title={name}
        className={`${base} bg-muted`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name}
          className="block size-full object-cover"
          loading="lazy"
        />
      </span>
    );
  }

  const color = PALETTE[hash(name) % PALETTE.length];
  return (
    <span
      aria-label={name}
      title={name}
      className={`${base} ${color}`}
    >
      {initials(name)}
    </span>
  );
}

import "flag-icons/css/flag-icons.min.css";
import { countryCode } from "@/lib/countries";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const sizePx: Record<Size, number> = {
  xs: 14,
  sm: 20,
  md: 28,
  lg: 40,
  xl: 56,
};

export function TeamFlag({
  team,
  size = "md",
  className = "",
}: {
  team: string;
  size?: Size;
  className?: string;
}) {
  const code = countryCode(team);
  const px = sizePx[size];
  const baseStyle: React.CSSProperties = {
    width: px,
    height: px,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  if (!code) {
    return (
      <span
        aria-hidden
        className={`inline-block shrink-0 rounded-md bg-muted ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={team}
      className={`fi fi-${code} inline-block shrink-0 overflow-hidden rounded-md ring-1 ring-black/5 ${className}`}
      style={baseStyle}
    />
  );
}

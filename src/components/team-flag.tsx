import "flag-icons/css/flag-icons.min.css";
import { countryCode } from "@/lib/countries";

type Size = "sm" | "md" | "lg" | "xl";

const sizeClass: Record<Size, string> = {
  sm: "h-3.5 w-5",
  md: "h-5 w-7",
  lg: "h-7 w-10",
  xl: "h-10 w-14",
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
  if (!code) {
    return (
      <span
        aria-hidden
        className={`inline-block rounded-sm bg-muted ${sizeClass[size]} ${className}`}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={team}
      className={`fi fi-${code} inline-block shrink-0 rounded-sm bg-cover bg-center ring-1 ring-black/5 ${sizeClass[size]} ${className}`}
    />
  );
}

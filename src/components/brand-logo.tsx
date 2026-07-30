import { cn } from "@/lib/utils";

type BhadaMarkProps = {
  className?: string;
  accentColor?: string;
};

export function BhadaMark({
  className,
  accentColor = "#e4c77a",
}: BhadaMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0", className)}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        stroke="currentColor"
        strokeWidth="1"
      />
      <text
        x="16"
        y="22"
        className="font-display"
        fill={accentColor}
        fontSize="17.5"
        textAnchor="middle"
      >
        भ
      </text>
    </svg>
  );
}

type BhadaLogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  accentColor?: string;
};

export function BhadaLogo({
  className,
  markClassName,
  wordmarkClassName,
  accentColor,
}: BhadaLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 whitespace-nowrap",
        className,
      )}
    >
      <BhadaMark
        className={cn("size-8", markClassName)}
        accentColor={accentColor}
      />
      <span
        className={cn(
          "font-display text-lg font-normal tracking-[0.015em]",
          wordmarkClassName,
        )}
      >
        Bhada
      </span>
    </span>
  );
}

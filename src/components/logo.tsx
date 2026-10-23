type Props = { className?: string; animated?: boolean; title?: string };

/**
 * The ladder: three maturities stepping up (a bond ladder, and three
 * generations), with the carnelian coupon dot over the longest one.
 */
export function LadderMark({ className, animated, title }: Props) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={`${className ?? ""} ${animated ? "ladder-rise" : ""}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect x="16" y="54" width="16" height="26" rx="6" className="fill-primary" opacity=".45" />
      <rect x="40" y="38" width="16" height="42" rx="6" className="fill-primary" opacity=".72" />
      <rect x="64" y="20" width="16" height="60" rx="6" className="fill-primary" />
      <circle cx="72" cy="10" r="5" className="fill-accent" />
    </svg>
  );
}

export function Wordmark({ name, className, animated }: { name: string; className?: string; animated?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold text-ink ${className ?? ""}`}>
      <LadderMark className="h-7 w-7" animated={animated} />
      <span className="text-lg tracking-wide">{name}</span>
    </span>
  );
}

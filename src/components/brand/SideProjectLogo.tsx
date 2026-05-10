/**
 * Inline brand marks for the /lab project tiles.
 *
 * - `bitcoin`: the canonical ₿ inside a tilted square — orange (#F7931A)
 *   because that's the recognizable signal; treating it as a domain icon
 *   rather than a brand color choice for the site.
 * - `applyagent`: a custom monogram — an "A" with a lime accent dot,
 *   echoing the HSK monogram's aesthetic so the two marks read as a set.
 */
export function SideProjectLogo({
  kind,
  size = 28,
  className,
}: {
  kind: "bitcoin" | "applyagent";
  size?: number;
  className?: string;
}) {
  if (kind === "bitcoin") {
    return (
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={className}
        aria-label="Bitcoin"
        role="img"
      >
        <circle cx="32" cy="32" r="30" fill="#F7931A" />
        <path
          d="M43.4 28.5c.5-3.4-2.1-5.3-5.7-6.5l1.2-4.8-2.9-.7-1.2 4.7c-.8-.2-1.6-.4-2.4-.5l1.2-4.7-2.9-.7-1.2 4.8c-.7-.2-1.3-.3-1.9-.5l0 0-4-1-.8 3.1s2.1.5 2.1.5c1.2.3 1.4 1.1 1.3 1.7l-1.3 5.4c.1 0 .2 0 .3.1l-.3-.1-1.8 7.6c-.1.3-.5.8-1.3.6 0 0-2.1-.5-2.1-.5l-1.5 3.3 3.7 .9c.7.2 1.4.4 2 .5l-1.2 4.9 2.9 .7 1.2-4.8c.8.2 1.6.4 2.4.6l-1.2 4.8 2.9 .7 1.2-4.9c4.9 .9 8.7.6 10.3-3.9 1.3-3.6-.1-5.7-2.7-7.1 1.9-.4 3.4-1.7 3.7-4.3zm-6.7 9.4c-.9 3.6-7 1.7-9 1.2l1.6-6.5c2 .5 8.3 1.5 7.4 5.3zm.9-9.5c-.8 3.3-5.9 1.6-7.6 1.2l1.5-5.9c1.7.4 7 1.2 6.1 4.7z"
          fill="#fff"
        />
      </svg>
    );
  }

  // ApplyAgent: stamp-style square frame echoing the HSK monogram. Inside,
  // a stylized "A" with a lime accent dot at the apex — the dot stands in
  // for the agent's cursor "landing" on a form field.
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-label="ApplyAgent monogram"
      role="img"
    >
      <rect
        x="2.5"
        y="2.5"
        width="35"
        height="35"
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="1"
      />
      <g
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* A — two legs joining at the apex with a crossbar */}
        <path d="M11 31 L20 9 L29 31" />
        <line x1="14.5" y1="23" x2="25.5" y2="23" />
      </g>
      {/* Accent dot at the A's apex — the "cursor" landing */}
      <circle
        cx="20"
        cy="9"
        r="1.8"
        fill="var(--color-accent, #c8ff00)"
      />
    </svg>
  );
}

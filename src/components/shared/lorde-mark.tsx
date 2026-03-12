interface LordeMarkProps {
  size?: number;
  className?: string;
}

/**
 * Lorde house mark — a minimal architectural icon with a hidden "L" in the
 * left-wall-and-floor path, and a brick-red diamond at the roof apex.
 * Renders inline SVG so it scales cleanly at any size.
 */
export function LordeMark({ size = 28, className }: LordeMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Roof chevron */}
      <path
        d="M14 25L28 13L42 25"
        stroke="#1B2B4B"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left wall + floor — the hidden "L" */}
      <path
        d="M20 25V41H36"
        stroke="#1B2B4B"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Brick-red diamond at apex */}
      <path
        d="M26.4 11.8L28 9.8L29.6 11.8L28 13.8L26.4 11.8Z"
        fill="#B03A2E"
      />
    </svg>
  );
}

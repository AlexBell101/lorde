/**
 * NavbarRoofline
 *
 * One continuous, non-repeating OTR rowhouse silhouette.
 * Fill defaults to the page sand colour so it reads as the hero
 * background rising into building shapes against the white navbar.
 *
 * Self-contained: handles its own absolute positioning at the
 * navbar bottom. Render directly inside the relative <header>.
 */
export function NavbarRoofline({
  className = "",
  fill = "#F5EFE6",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute bottom-[-1px] left-0 w-full overflow-visible ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 22"
        preserveAspectRatio="none"
        className="block h-[14px] w-full sm:h-[16px] md:h-[18px] lg:h-[20px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* OTR rowhouse skyline — continuous, irregular, non-repeating */}
        <path
          fill={fill}
          d="
            M0 22
            L0 12
            L60 12
            L60 6
            L67 6
            L67 12
            L125 12
            L125 9
            L180 9
            L188 3
            L196 9
            L250 9
            L250 14
            L310 14
            L310 9
            L317 9
            L317 14
            L375 14
            L375 8
            L437 8
            L437 5
            L444 5
            L444 8
            L500 8
            L500 11
            L555 11
            L563 4
            L571 11
            L630 11
            L630 13
            L680 13
            L680 9
            L740 9
            L748 3
            L756 9
            L820 9
            L820 12
            L875 12
            L883 7
            L890 7
            L890 12
            L955 12
            L955 8
            L1010 8
            L1010 11
            L1077 11
            L1077 6
            L1084 6
            L1084 11
            L1135 11
            L1135 9
            L1198 9
            L1206 2
            L1214 9
            L1265 9
            L1265 12
            L1328 12
            L1328 7
            L1335 7
            L1335 12
            L1395 12
            L1395 10
            L1440 10
            L1440 22
            Z
          "
        />
        {/* Subtle ground shadow to anchor the roofline */}
        <path
          fill="rgba(15,30,46,0.04)"
          d="M0 22 L0 19 L1440 19 L1440 22 Z"
        />
      </svg>
    </div>
  );
}

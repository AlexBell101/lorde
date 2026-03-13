/**
 * NavbarRoofline — OTR rowhouse silhouette at the navbar bottom edge.
 *
 * 10 wide buildings so shapes stay readable at rendered size.
 * Peaks at y=2 (gables) and y=4 (chimneys) sit right at the SVG top edge,
 * which is positioned flush with the navbar bottom via top-full.
 * Cornices at y=9–12. Fill closes at y=18 (ground).
 *
 * Opacity raised to 0.15 so it reads against the sand hero background
 * without competing with nav content.
 */
export function NavbarRoofline() {
  const d = [
    "M0,18 L0,10",

    // B1 — y=10, chimney x=20–28 → y=4
    "L20,10 L20,4 L28,4 L28,10 L130,10",

    // B2 — step y=9, Italianate gable center x=205 → y=2
    "L130,9 L175,9 L205,2 L235,9 L280,9",

    // B3 — step y=10, chimney x=300–308 → y=4
    "L280,10 L300,10 L300,4 L308,4 L308,10 L420,10",

    // B4 — step y=9, gable center x=495 → y=2
    "L420,9 L465,9 L495,2 L525,9 L570,9",

    // B5 — step y=12 (shorter parapet), chimney x=590–598 → y=6
    "L570,12 L590,12 L590,6 L598,6 L598,12 L690,12",

    // B6 — step y=9, tallest gable center x=765 → y=2
    "L690,9 L735,9 L765,2 L795,9 L840,9",

    // B7 — step y=10, chimney x=860–868 → y=4
    "L840,10 L860,10 L860,4 L868,4 L868,10 L990,10",

    // B8 — step y=9, gable center x=1065 → y=2
    "L990,9 L1035,9 L1065,2 L1095,9 L1140,9",

    // B9 — step y=10, chimney x=1160–1168 → y=4
    "L1140,10 L1160,10 L1160,4 L1168,4 L1168,10 L1280,10",

    // B10 — step y=9, gable center x=1360 → y=2, close
    "L1280,9 L1325,9 L1360,2 L1395,9 L1440,9",

    "L1440,18 Z",
  ].join(" ");

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 18"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className="hidden sm:block w-full pointer-events-none select-none"
      style={{ height: 18, display: "block" }}
    >
      <path d={d} fill="#1B2B4B" fillOpacity="0.15" />
    </svg>
  );
}

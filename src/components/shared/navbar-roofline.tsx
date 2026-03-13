/**
 * NavbarRoofline — OTR rowhouse silhouette sitting right at the navbar bottom edge.
 *
 * Peaks live at y=1–2 (top of viewBox) so they appear immediately below the
 * navbar border against the hero background — not hidden inside the white nav.
 * Cornice lines sit at y=7–10. Fill closes at y=18 (SVG bottom).
 *
 * 18 buildings: alternating narrow chimneys (6px wide) and steep Italianate
 * gables (12px half-width). Hard vertical steps between adjacent building
 * heights so the silhouette reads as dense urban architecture, not landscape.
 *
 * pointer-events disabled. Hidden on mobile (sm:block).
 * Stretches full-width via preserveAspectRatio="none".
 */
export function NavbarRoofline() {
  const d = [
    // Start: bottom-left corner, rise to first cornice
    "M0,18 L0,8",

    // B1 — y=8, chimney x=10–16 → y=2
    "L10,8 L10,2 L16,2 L16,8 L80,8",

    // B2 — step up y=7, Italianate gable center x=122 → y=1
    "L80,7 L110,7 L122,1 L134,7 L165,7",

    // B3 — step down y=8, chimney x=180–186 → y=2
    "L165,8 L180,8 L180,2 L186,2 L186,8 L245,8",

    // B4 — step up y=7, gable center x=285 → y=2
    "L245,7 L273,7 L285,2 L297,7 L330,7",

    // B5 — step down y=10 (shorter building), chimney x=345–351 → y=4
    "L330,10 L345,10 L345,4 L351,4 L351,10 L400,10",

    // B6 — step up y=7, tallest gable center x=443 → y=1
    "L400,7 L431,7 L443,1 L455,7 L490,7",

    // B7 — step down y=8, chimney x=505–511 → y=2
    "L490,8 L505,8 L505,2 L511,2 L511,8 L570,8",

    // B8 — step up y=7, gable center x=610 → y=2
    "L570,7 L598,7 L610,2 L622,7 L655,7",

    // B9 — step down y=8, chimney x=670–676 → y=2
    "L655,8 L670,8 L670,2 L676,2 L676,8 L735,8",

    // B10 — step up y=7, gable center x=775 → y=1
    "L735,7 L763,7 L775,1 L787,7 L820,7",

    // B11 — step down y=10 (shorter), chimney x=835–841 → y=4
    "L820,10 L835,10 L835,4 L841,4 L841,10 L890,10",

    // B12 — step up y=7, gable center x=933 → y=2
    "L890,7 L921,7 L933,2 L945,7 L980,7",

    // B13 — step down y=8, chimney x=995–1001 → y=2
    "L980,8 L995,8 L995,2 L1001,2 L1001,8 L1060,8",

    // B14 — step up y=7, gable center x=1103 → y=1
    "L1060,7 L1091,7 L1103,1 L1115,7 L1150,7",

    // B15 — step down y=8, chimney x=1165–1171 → y=2
    "L1150,8 L1165,8 L1165,2 L1171,2 L1171,8 L1230,8",

    // B16 — step up y=7, gable center x=1270 → y=2
    "L1230,7 L1258,7 L1270,2 L1282,7 L1315,7",

    // B17 — step down y=8, chimney x=1330–1336 → y=2
    "L1315,8 L1330,8 L1330,2 L1336,2 L1336,8 L1395,8",

    // B18 — step up y=7, gable center x=1415 → y=1, close
    "L1395,7 L1403,7 L1415,1 L1427,7 L1440,7",

    // Close: drop to bottom-right, seal shape
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
      <path d={d} fill="#1B2B4B" fillOpacity="0.1" />
    </svg>
  );
}

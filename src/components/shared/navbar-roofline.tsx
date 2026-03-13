/**
 * NavbarRoofline — OTR rowhouse silhouette at the navbar bottom edge.
 *
 * 15 buildings: alternating chimneys and Italianate gables, varying heights.
 * The SVG straddles the navbar/hero boundary — peaks inside the nav,
 * fill extending into the hero — to visually bridge the two sections.
 *
 * Hidden on mobile. Stretches full-width on tablet/desktop via
 * preserveAspectRatio="none" against a 1440-wide viewBox.
 * pointer-events disabled throughout.
 */
export function NavbarRoofline() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 20"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className="hidden sm:block w-full h-[18px] pointer-events-none select-none"
    >
      {/*
        Path traces from bottom-left → up to roofline → right across
        15 OTR rowhouses (alternating chimneys + gabled peaks) → down
        to bottom-right → closes.

        y=20: SVG bottom (baseline / ground)
        y=11–14: flat roof cornice levels (varying building heights)
        y=3–5: Italianate gable peaks
        y=7–9: chimney tops
      */}
      <path
        d={[
          // Start
          "M0,20 L0,13",
          // B1 — chimney at x=25–29
          "L25,13 L25,8 L29,8 L29,13 L90,13",
          // B2 — gable peak at x=135 y=5
          "L90,11 L120,11 L135,5 L150,11 L185,11",
          // B3 — chimney at x=215–220
          "L185,13 L215,13 L215,7 L220,7 L220,13 L270,13",
          // B4 — gable peak at x=325 y=5
          "L270,11 L310,11 L320,9 L325,5 L330,9 L335,11 L380,11",
          // B5 — shorter building, chimney at x=425–430
          "L380,14 L425,14 L425,9 L430,9 L430,14 L460,14",
          // B6 — tallest gable peak at x=500 y=3
          "L460,12 L480,12 L490,6 L500,3 L510,6 L520,12 L560,12",
          // B7 — chimney at x=570–574
          "L560,13 L570,13 L570,8 L574,8 L574,13 L650,13",
          // B8 — gable peak at x=705 y=4
          "L650,11 L680,11 L695,7 L705,4 L715,7 L730,11 L750,11",
          // B9 — chimney at x=780–785
          "L750,13 L780,13 L780,8 L785,8 L785,13 L840,13",
          // B10 — gable peak at x=890 y=5
          "L840,12 L870,12 L885,8 L890,5 L895,8 L910,12 L940,12",
          // B11 — chimney at x=975–980
          "L940,13 L975,13 L975,8 L980,8 L980,13 L1040,13",
          // B12 — gable peak at x=1090 y=4
          "L1040,11 L1065,11 L1080,7 L1090,4 L1100,7 L1115,11 L1140,11",
          // B13 — chimney at x=1170–1175
          "L1140,13 L1170,13 L1170,8 L1175,8 L1175,13 L1240,13",
          // B14 — gable peak at x=1295 y=5
          "L1240,12 L1270,12 L1285,8 L1295,5 L1305,8 L1320,12 L1340,12",
          // B15 — chimney at x=1380–1385, close
          "L1340,13 L1380,13 L1380,8 L1385,8 L1385,13 L1440,13",
          // Close
          "L1440,20 Z",
        ].join(" ")}
        fill="#1B2B4B"
        fillOpacity="0.08"
      />
    </svg>
  );
}

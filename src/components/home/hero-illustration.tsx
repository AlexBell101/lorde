/**
 * HeroIllustration
 *
 * Abstract OTR rowhouse silhouette for the hero right column.
 * One continuous connected roofline path — 7 buildings, varying heights,
 * Italianate gable peaks, narrow chimneys, hard vertical steps between
 * buildings. Navy at 8% opacity: reads as editorial architectural branding.
 *
 * SVG fills its container via preserveAspectRatio="xMidYMin slice".
 * Place inside a relative overflow-hidden container.
 */
export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 580 560"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMin slice"
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#0F1E2E"
        fillOpacity="0.08"
        d="
          M0,560
          L0,245
          L18,245 L18,185 L28,185 L28,245
          L90,245
          L90,205
          L112,205 L137,110 L162,205
          L185,205
          L185,255
          L200,255 L200,200 L212,200 L212,255
          L275,255
          L275,170
          L305,170 L332,75 L359,170
          L390,170
          L390,300
          L455,300
          L455,225
          L472,225 L472,175 L482,175 L482,225
          L545,225
          L545,195
          L555,195 L568,120 L580,195
          L580,560
          Z
        "
      />
    </svg>
  );
}

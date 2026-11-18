import { colors, spacing, typography } from "@/designTokens";

// The Budget dashboard, served on this site through its app zone route
// (src/data/appZoneRoutes.ts).
const DASHBOARD_URL = "/uk/budgets/autumn-2026";
// The Milburn review dashboard, served the same way.
const MILBURN_REVIEW_URL = "/uk/milburn-review";
// The recording of our Budget-day webinar on 28 October.
const RECORDING_URL = "https://www.youtube.com/watch?v=ZutKULXLhU0";

const pill = {
  borderRadius: 999,
  padding: "8px 18px",
  fontSize: 15,
  fontWeight: 600,
  whiteSpace: "nowrap",
  textDecoration: "none",
} as const;

export default function AutumnBudgetEventBanner({
  countryId,
}: {
  countryId: string;
}) {
  if (countryId !== "uk") return null;

  return (
    <div
      style={{
        // Stay pinned just below the sticky header while scrolling.
        position: "sticky",
        top: spacing.layout.header,
        zIndex: 999,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px 20px",
        background: colors.primary[50],
        borderBottom: `1px solid ${colors.primary[100]}`,
        color: colors.primary[900],
        textAlign: "center",
        padding: "16px",
        fontFamily: typography.fontFamily.primary,
        fontSize: 17,
        fontWeight: 500,
        lineHeight: 1.4,
      }}
    >
      <span>
        <strong style={{ fontWeight: 700 }}>Autumn Budget 2026:</strong> explore
        our analysis, and watch our same-day first look
      </span>
      <span
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: spacing.md,
        }}
      >
        {/* The aria-labels name the Budget for screen readers' link lists,
            and start with the visible text so voice control still matches. */}
        <a
          href={DASHBOARD_URL}
          aria-label="See the analysis of Autumn Budget 2026"
          style={{
            ...pill,
            background: colors.primary[600],
            color: colors.white,
          }}
        >
          See the analysis &rarr;
        </a>
        <a
          href={RECORDING_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Watch the recording of our Autumn Budget 2026 webinar (opens in a new tab)"
          style={{
            ...pill,
            background: colors.white,
            color: colors.primary[700],
            border: `1px solid ${colors.primary[600]}`,
          }}
        >
          Watch the recording &rarr;
        </a>
      </span>
      {/* A quieter line of its own under the Budget's, at every width. */}
      <span
        style={{
          flexBasis: "100%",
          fontSize: typography.fontSize.sm,
          lineHeight: typography.lineHeight["20"],
        }}
      >
        <strong style={{ fontWeight: typography.fontWeight.semibold }}>
          Milburn review of young people and work:
        </strong>{" "}
        <a
          href={MILBURN_REVIEW_URL}
          aria-label="See our analysis of the Milburn review of young people and work"
          style={{
            // Taller than its line, so it is easy to tap on a phone.
            display: "inline-block",
            padding: `${spacing.xs} 0`,
            color: colors.primary[700],
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          see our analysis &rarr;
        </a>
      </span>
    </div>
  );
}

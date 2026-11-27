import { colors, spacing, typography } from "@/designTokens";

// The Budget dashboard, served on this site through its app zone route
// (src/data/appZoneRoutes.ts).
const DASHBOARD_URL = "/uk/budgets/autumn-2026";
// The Milburn review dashboard, served the same way.
const MILBURN_REVIEW_URL = "/uk/milburn-review";
// Our briefing on the review's proposals.
const MILBURN_BRIEFING_URL = "/uk/research/uk-milburn-review-briefing";
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

  // One banner row: the event's name in bold, a line about it, and its links as pills.
  const row = (background: string, border: string, text: string) =>
    ({
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px 20px",
      background,
      borderBottom: `1px solid ${border}`,
      color: text,
      textAlign: "center",
      padding: "16px",
    }) as const;
  const links = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
  } as const;

  return (
    <div
      data-testid="event-banner"
      style={{
        // Stay pinned just below the sticky header while scrolling.
        position: "sticky",
        top: spacing.layout.header,
        zIndex: 999,
        fontFamily: typography.fontFamily.primary,
        fontSize: 17,
        fontWeight: 500,
        lineHeight: 1.4,
      }}
    >
      {/* The Milburn review, first and in its own colour */}
      <div
        data-testid="milburn-banner"
        style={row(
          colors.secondary[50],
          colors.secondary[200],
          colors.secondary[900],
        )}
      >
        <span>
          <strong style={{ fontWeight: 700 }}>
            Milburn review of young people and work:
          </strong>{" "}
          explore our analysis of its proposals
        </span>
        <span style={links}>
          <a
            href={MILBURN_REVIEW_URL}
            aria-label="See the dashboard of the Milburn review of young people and work"
            style={{
              ...pill,
              background: colors.secondary[700],
              color: colors.white,
            }}
          >
            See the dashboard &rarr;
          </a>
          <a
            href={MILBURN_BRIEFING_URL}
            aria-label="Read the briefing on the Milburn review of young people and work"
            style={{
              ...pill,
              background: colors.white,
              color: colors.secondary[700],
              border: `1px solid ${colors.secondary[700]}`,
            }}
          >
            Read the briefing &rarr;
          </a>
        </span>
      </div>
      <div
        data-testid="budget-banner"
        style={row(
          colors.primary[50],
          colors.primary[100],
          colors.primary[900],
        )}
      >
        <span>
          <strong style={{ fontWeight: 700 }}>Autumn Budget 2026:</strong>{" "}
          explore our analysis, and watch our same-day first look
        </span>
        <span style={links}>
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
      </div>
    </div>
  );
}

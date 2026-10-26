import { colors, spacing, typography } from "@/designTokens";

// The Budget dashboard, served on this site through its app zone route
// (src/data/appZoneRoutes.ts).
const DASHBOARD_URL = "/uk/budgets/autumn-2026";
const EVENT_URL =
  "https://us06web.zoom.us/meeting/register/2DLUeZAbRwKkKEK-2JrFrQ";

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
        our analysis, and join our same-day first look online, Wednesday 28
        October, 4:30pm
      </span>
      <span
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <a
          href={DASHBOARD_URL}
          style={{
            ...pill,
            background: colors.primary[600],
            color: colors.white,
          }}
        >
          See the analysis &rarr;
        </a>
        <a
          href={EVENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...pill,
            background: colors.white,
            color: colors.primary[700],
            border: `1px solid ${colors.primary[600]}`,
          }}
        >
          Register free &rarr;
        </a>
      </span>
    </div>
  );
}

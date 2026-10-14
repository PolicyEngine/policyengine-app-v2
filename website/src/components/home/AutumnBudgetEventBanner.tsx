import { colors, typography } from "@/designTokens";

const EVENT_URL =
  "https://www.eventbrite.co.uk/e/autumn-budget-2026-policyengines-same-day-first-look-tickets-2003359829178";

export default function AutumnBudgetEventBanner({
  countryId,
}: {
  countryId: string;
}) {
  if (countryId !== "uk") return null;

  return (
    <a
      href={EVENT_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px 20px",
        background: colors.warning,
        color: colors.gray[900],
        textAlign: "center",
        padding: "16px",
        fontFamily: typography.fontFamily.primary,
        fontSize: 17,
        fontWeight: 500,
        lineHeight: 1.4,
        textDecoration: "none",
      }}
    >
      <span>
        <strong style={{ fontWeight: 700 }}>Autumn Budget 2026:</strong> join
        our same-day first look online, Wednesday 28 October, 4:30pm
      </span>
      <span
        style={{
          background: colors.gray[900],
          color: colors.white,
          borderRadius: 999,
          padding: "8px 18px",
          fontSize: 15,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        Register free &rarr;
      </span>
    </a>
  );
}

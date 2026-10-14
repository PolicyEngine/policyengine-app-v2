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
        display: "block",
        background: colors.primary[700],
        color: "white",
        textAlign: "center",
        padding: "10px 16px",
        fontFamily: typography.fontFamily.primary,
        fontSize: 14,
        fontWeight: 500,
        textDecoration: "none",
        letterSpacing: "0.02em",
      }}
    >
      Autumn Budget 2026: join our same-day first look online, Wednesday 28
      October, 4:30pm.{" "}
      <span style={{ textDecoration: "underline", fontWeight: 600 }}>
        Register free &rarr;
      </span>
    </a>
  );
}

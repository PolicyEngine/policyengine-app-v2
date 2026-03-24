import Link from "next/link";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";
import { getToolsForCountry } from "@/data/tools";

function ActionLink({
  href,
  label,
  external = false,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.primary,
  };

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
        {label} &rarr;
      </a>
    );
  }

  return (
    <Link href={href} style={style}>
      {label} &rarr;
    </Link>
  );
}

export default function HomeToolsPreview({
  countryId,
}: {
  countryId: string;
}) {
  const tools = getToolsForCountry(countryId).slice(0, 3);

  if (tools.length === 0) return null;

  return (
    <section
      style={{
        backgroundColor: colors.white,
        paddingTop: spacing["5xl"],
        paddingBottom: spacing["5xl"],
        borderBottom: `1px solid ${colors.border.light}`,
      }}
    >
      <div
        style={{
          maxWidth: spacing.layout.content,
          margin: "0 auto",
          padding: `0 ${spacing.xl}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: spacing.lg,
            marginBottom: spacing["3xl"],
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: "720px" }}>
            <p
              style={{
                margin: 0,
                color: colors.primary[600],
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: typography.fontFamily.primary,
              }}
            >
              Tools
            </p>
            <h2
              style={{
                marginTop: spacing.sm,
                marginBottom: spacing.md,
                color: colors.gray[900],
                fontSize: "clamp(30px, 4vw, 40px)",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                fontWeight: typography.fontWeight.bold,
                fontFamily: typography.fontFamily.primary,
              }}
            >
              Open tools, not just articles.
            </h2>
            <p
              style={{
                margin: 0,
                color: colors.text.secondary,
                fontSize: typography.fontSize.lg,
                lineHeight: typography.lineHeight.relaxed,
                fontFamily: typography.fontFamily.primary,
              }}
            >
              Explore calculators, developer tools, and analysis tools built
              for real use cases.
            </p>
          </div>
          <Link
            href={`/${countryId}/tools`}
            style={{
              textDecoration: "none",
              color: colors.primary[700],
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            View all tools &rarr;
          </Link>
        </div>

        <div
          className="grid gap-6 lg:grid-cols-3"
          style={{ alignItems: "stretch" }}
        >
          {tools.map((tool) => (
            <article
              key={tool.slug}
              style={{
                height: "100%",
                borderRadius: spacing.radius.feature,
                padding: spacing["2xl"],
                background:
                  "linear-gradient(180deg, rgba(249,250,251,1) 0%, rgba(255,255,255,1) 100%)",
                border: `1px solid ${colors.border.light}`,
                boxShadow: `0 18px 44px -34px ${colors.shadow.dark}`,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  padding: "6px 10px",
                  borderRadius: "999px",
                  backgroundColor: colors.primary[50],
                  color: colors.primary[700],
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: spacing.lg,
                }}
              >
                {tool.kind}
              </div>

              <h3
                style={{
                  marginTop: 0,
                  marginBottom: spacing.md,
                  color: colors.gray[900],
                  fontSize: typography.fontSize["2xl"],
                  lineHeight: 1.12,
                  fontWeight: typography.fontWeight.bold,
                  fontFamily: typography.fontFamily.primary,
                }}
              >
                {tool.title}
              </h3>

              <p
                style={{
                  marginTop: 0,
                  marginBottom: spacing.lg,
                  color: colors.text.secondary,
                  fontSize: typography.fontSize.base,
                  lineHeight: typography.lineHeight.relaxed,
                  fontFamily: typography.fontFamily.primary,
                  flex: 1,
                }}
              >
                {tool.summary}
              </p>

              <ActionLink
                href={tool.primaryAction.href}
                label={tool.primaryAction.label}
                external={tool.primaryAction.external}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

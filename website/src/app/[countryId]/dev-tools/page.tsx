import type { Metadata } from "next";
import Link from "next/link";
import HeroSection from "@/components/static/HeroSection";
import { Text, Title } from "@/components/ui";
import { colors, spacing, typography } from "@policyengine/design-system/tokens";

interface DevToolCardProps {
  href: string;
  title: string;
  description: string;
}

function DevToolCard({ href, title, description }: DevToolCardProps) {
  return (
    <Link
      href={href}
      className="tw:block tw:no-underline tw:transition-all tw:duration-200 tw:hover:-translate-y-0.5"
      style={{
        padding: spacing["2xl"],
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
      }}
    >
      <Title
        order={3}
        style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold,
          fontFamily: typography.fontFamily.primary,
          color: colors.text.primary,
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Title>
      <Text
        style={{
          fontSize: typography.fontSize.base,
          color: colors.text.secondary,
          lineHeight: typography.lineHeight.relaxed,
        }}
      >
        {description}
      </Text>
    </Link>
  );
}

const DEV_TOOL_CARDS = [
  {
    slug: "api-status",
    title: "API status",
    description:
      "Check the current status and availability of PolicyEngine API endpoints.",
  },
];

export const metadata: Metadata = {
  title: "Developer tools",
  description: "Tools and resources for developers building on PolicyEngine.",
};

export default async function DevToolsPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;

  return (
    <div
      style={{
        minHeight: `calc(100vh - ${spacing.layout.header})`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <HeroSection
        title="Developer tools"
        description="Tools and resources for developers building on the PolicyEngine platform."
      />

      <div
        className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:md:grid-cols-3 tw:gap-xl"
        style={{
          flex: 1,
          paddingTop: spacing["4xl"],
          paddingBottom: spacing["4xl"],
          backgroundColor: colors.background.tertiary,
          paddingLeft: "6.125%",
          paddingRight: "6.125%",
          alignContent: "start",
        }}
      >
        {DEV_TOOL_CARDS.map((card) => (
          <DevToolCard
            key={card.slug}
            href={`/${countryId}/dev-tools/${card.slug}`}
            title={card.title}
            description={card.description}
          />
        ))}
      </div>
    </div>
  );
}

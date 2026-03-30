import type { Metadata } from "next";
import Link from "next/link";
import HeroSection from "@/components/static/HeroSection";
import { Text, Title } from "@/components/ui";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

export const metadata: Metadata = {
  title: "Brand",
};

interface BrandCardProps {
  href: string;
  title: string;
  description: string;
  meta: string;
}

function BrandCard({ href, title, description, meta }: BrandCardProps) {
  return (
    <Link
      href={href}
      className="tw:block tw:no-underline tw:transition-all tw:duration-200 tw:hover:-translate-y-0.5 tw:border tw:border-border-light tw:hover:border-primary-500 tw:hover:shadow-md tw:bg-white tw:rounded-container"
      style={{
        padding: spacing["2xl"],
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
          marginBottom: spacing.lg,
        }}
      >
        {description}
      </Text>
      <Text
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.tertiary,
        }}
      >
        {meta}
      </Text>
    </Link>
  );
}

const brandCards: BrandCardProps[] = [
  {
    href: "brand/design",
    title: "Design system",
    description:
      "Colors, typography, spacing, and component tokens for building consistent PolicyEngine interfaces.",
    meta: "Tokens and guidelines",
  },
  {
    href: "brand/writing",
    title: "Writing guide",
    description:
      "Voice, tone, and style guidelines for clear, research-oriented communication.",
    meta: "Content standards",
  },
  {
    href: "brand/assets",
    title: "Assets",
    description:
      "Logo files, usage guidelines, and brand resources for partners and press.",
    meta: "Downloads and guidelines",
  },
];

export default function BrandPage() {
  return (
    <>
      <HeroSection
        title="Brand"
        description="Resources for representing PolicyEngine consistently across platforms, publications, and partnerships."
      />

      <div
        className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:md:grid-cols-3 tw:gap-xl"
        style={{
          paddingTop: spacing["4xl"],
          paddingBottom: spacing["4xl"],
          backgroundColor: colors.background.tertiary,
          paddingLeft: "6.125%",
          paddingRight: "6.125%",
        }}
      >
        {brandCards.map((card) => (
          <BrandCard key={card.href} {...card} />
        ))}
      </div>
    </>
  );
}

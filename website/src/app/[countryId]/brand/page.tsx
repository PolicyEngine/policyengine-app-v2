import type { Metadata } from "next";
import Link from "next/link";
import HeroSection from "@/components/static/HeroSection";
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
      style={{
        display: "block",
        textDecoration: "none",
        padding: spacing["2xl"],
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        transition: "all 200ms",
      }}
    >
      <h3
        style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold,
          fontFamily: typography.fontFamily.primary,
          color: colors.text.primary,
          marginBottom: spacing.sm,
          marginTop: 0,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: typography.fontSize.base,
          color: colors.text.secondary,
          lineHeight: typography.lineHeight.relaxed,
          marginBottom: spacing.lg,
          marginTop: 0,
        }}
      >
        {description}
      </p>
      <p
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.tertiary,
          margin: 0,
        }}
      >
        {meta}
      </p>
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
        style={{
          paddingTop: spacing["4xl"],
          paddingBottom: spacing["4xl"],
          backgroundColor: colors.background.tertiary,
          paddingLeft: "6.125%",
          paddingRight: "6.125%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: spacing.xl,
        }}
      >
        {brandCards.map((card) => (
          <BrandCard key={card.href} {...card} />
        ))}
      </div>
    </>
  );
}

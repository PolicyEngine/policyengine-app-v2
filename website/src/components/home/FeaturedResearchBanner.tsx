"use client";

import { useState } from "react";
import { IconArrowRight, IconX } from "@tabler/icons-react";
import { colors, spacing, typography } from "@/designTokens";

const BANNER_DISMISSED_KEY = "featured-research-banner-dismissed";

const cards = [
  {
    href: "/uk/milburn-review",
    title: "The Milburn review of young people and work",
    desc: "What its benefit and employer National Insurance proposals would change, by age and household",
  },
  {
    href: "/uk/research/uk-energy-price-cap-january-2027-forecast",
    title: "The January 2027 energy price cap forecast",
    desc: "What Cornwall Insight's forecast would mean for household energy bills",
  },
  {
    href: "/uk/budgets/autumn-2026",
    title: "Autumn Budget 2026",
    desc: "What the Budget's measures mean for the public finances and household incomes",
  },
  {
    href: "/uk/triple-lock",
    title: "Replacing the triple lock",
    desc: "What the Burnham plan would save, and which households would have less income",
  },
];

export default function FeaturedResearchBanner({
  countryId,
}: {
  countryId: string;
}) {
  const [visible, setVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(BANNER_DISMISSED_KEY) !== "true";
    }
    return true;
  });

  if (countryId !== "uk" || !visible) return null;

  const handleClose = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, "true");
    }
  };

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(to right, ${colors.primary[800]}, ${colors.primary[600]})`,
        padding: `${spacing["2xl"]} ${spacing.xl}`,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        style={{
          position: "absolute",
          top: spacing.md,
          right: spacing.md,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "6px",
          color: "rgba(255, 255, 255, 0.7)",
          zIndex: 10,
        }}
      >
        <IconX size={18} />
      </button>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: spacing.layout.content,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontSize: typography.fontSize["2xl"],
            fontWeight: typography.fontWeight.semibold,
            color: colors.white,
            marginBottom: spacing.xl,
            textAlign: "center",
            letterSpacing: "-0.01em",
          }}
        >
          Our latest research
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: spacing.md,
          }}
        >
          {cards.map((card) => (
            <a
              key={card.href}
              href={card.href}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                textDecoration: "none",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(12px)",
                borderRadius: "12px",
                padding: spacing.lg,
                border: "1px solid rgba(255, 255, 255, 0.12)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.14)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.white,
                    marginBottom: spacing.xs,
                    lineHeight: typography.lineHeight.snug,
                  }}
                >
                  {card.title}
                </p>
                <p
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: "rgba(255, 255, 255, 0.7)",
                    lineHeight: typography.lineHeight.normal,
                  }}
                >
                  {card.desc}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: "12px",
                  color: "rgba(255, 255, 255, 0.5)",
                }}
              >
                <IconArrowRight size={16} />
              </div>
            </a>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: spacing.xl }}>
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            Want custom analysis?{" "}
            <a
              href="mailto:hello@policyengine.org"
              style={{
                color: colors.white,
                fontWeight: typography.fontWeight.medium,
                textDecoration: "underline",
              }}
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

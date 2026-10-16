"use client";

import { useState } from "react";
import { IconArrowRight, IconX } from "@tabler/icons-react";
import {
  colors,
  spacing,
  typography,
} from "@/designTokens";

const BANNER_DISMISSED_KEY = "featured-research-banner-dismissed";

const cards = [
  {
    href: "/uk/triple-lock",
    title: "Replacing the triple lock",
    desc: "What the Burnham plan would save, and which households would have less income",
  },
  {
    href: "/uk/energy-autumn-budget",
    title: "Energy bills and the Autumn Budget",
    desc: "What households will pay over the next two winters, and seven ways the Chancellor could help",
  },
  {
    href: "/uk/childcare-100k-threshold",
    title: "Scrapping the childcare cliff edge",
    desc: "What it would cost to remove the £100,000 limit on free hours and Tax-Free Childcare",
  },
  {
    href: "/uk/targeted-energy-discount",
    title: "A targeted energy bill discount",
    desc: "Who would gain, and at what cost, from the Resolution Foundation's proposal",
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
          Our latest research ahead of the Autumn Budget
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

"use client";

import { useState } from "react";
import { IconX } from "@tabler/icons-react";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

const BANNER_DISMISSED_KEY = "downing-street-banner-dismissed";
const GOV_UK_ARTICLE_URL =
  "https://fellows.ai.gov.uk/articles/nikhil-woodruff-micro-simulation";

export default function DowningStreetBanner({
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

  if (!visible) return null;

  // Show until end of February 2026
  const currentDate = new Date();
  const endDate = new Date("2026-02-28");
  if (currentDate > endDate) return null;

  const handleClose = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, "true");
    }
  };

  return (
    <a
      href={GOV_UK_ARTICLE_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        position: "relative",
        textDecoration: "none",
        cursor: "pointer",
        background: `linear-gradient(135deg, ${colors.gray[900]} 0%, ${colors.gray[800]} 50%, ${colors.primary[700]} 100%)`,
        padding: `${spacing.md} ${spacing.xl}`,
        fontFamily: typography.fontFamily.primary,
        transition: "opacity 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: spacing.lg,
          maxWidth: spacing.layout.content,
          margin: "0 auto",
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.bold,
            color: colors.primary[300],
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Featured
        </span>
        <span
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.white,
          }}
        >
          {countryId === "uk"
            ? "Our technology supports policy analysis at 10 Downing Street"
            : "Our technology supports policy analysis at the UK Prime Minister's office"}
        </span>
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.primary[300],
            display: "flex",
            alignItems: "center",
            gap: spacing.xs,
          }}
        >
          Learn more →
        </span>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }}
        style={{
          position: "absolute",
          top: "50%",
          right: spacing.lg,
          transform: "translateY(-50%)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          borderRadius: "4px",
          color: colors.white,
          opacity: 0.7,
        }}
      >
        <IconX size={16} />
      </button>
    </a>
  );
}

import { ReactNode } from "react";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";
import ActionButton, { ActionButtonProps } from "./ActionButton";

export interface CTASectionProps {
  title?: string;
  variant?: "primary" | "secondary" | "accent";
  content: ReactNode;
  cta: Omit<ActionButtonProps, "variant">;
  caption?: string;
}

const backgrounds = {
  primary: colors.white,
  secondary: colors.gray[100],
  accent: colors.primary[700],
};

const textColors = {
  primary: colors.text.primary,
  secondary: colors.text.primary,
  accent: colors.text.inverse,
};

export default function CTASection({
  title,
  variant = "accent",
  content,
  cta,
  caption,
}: CTASectionProps) {
  const isInverted = variant === "accent";

  return (
    <div
      style={{
        paddingTop: spacing["4xl"],
        paddingBottom: spacing["4xl"],
        backgroundColor: backgrounds[variant],
        borderBottom: `1px solid ${colors.border.dark}`,
        paddingLeft: "6.125%",
        paddingRight: "6.125%",
      }}
    >
      <div style={{ maxWidth: "1280px" }}>
        {title && (
          <h2
            style={{
              fontSize: typography.fontSize["3xl"],
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily.primary,
              color: textColors[variant],
              marginTop: 0,
              marginBottom: spacing.xl,
            }}
          >
            {title}
          </h2>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          <div style={{ flex: 1.5, color: textColors[variant] }}>{content}</div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActionButton
              {...cta}
              variant={isInverted ? "inverted" : "primary"}
              caption={caption}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

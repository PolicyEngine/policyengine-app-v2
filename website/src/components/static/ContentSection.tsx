import { ReactNode } from "react";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

export interface ContentSectionProps {
  title?: string;
  variant?: "primary" | "secondary" | "accent";
  children: ReactNode;
}

export default function ContentSection({
  title,
  variant = "primary",
  children,
}: ContentSectionProps) {
  const backgrounds: Record<string, string> = {
    primary: colors.white,
    secondary: colors.gray[100],
    accent: colors.primary[700],
  };

  const textColors: Record<string, string> = {
    primary: colors.text.primary,
    secondary: colors.text.primary,
    accent: colors.text.inverse,
  };

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
              marginBottom: spacing.xl,
            }}
          >
            {title}
          </h2>
        )}
        <div style={{ color: textColors[variant] }}>{children}</div>
      </div>
    </div>
  );
}

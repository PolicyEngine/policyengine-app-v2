import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

export interface ActionButtonProps {
  text: string;
  href: string;
  variant?: "primary" | "secondary" | "inverted";
  caption?: string;
}

const buttonStyles = {
  primary: {
    backgroundColor: colors.white,
    color: colors.text.primary,
    border: `2px solid ${colors.border.light}`,
  },
  secondary: {
    backgroundColor: colors.primary[500],
    color: colors.white,
    border: `2px solid ${colors.primary[500]}`,
  },
  inverted: {
    backgroundColor: colors.white,
    color: colors.text.primary,
    border: `2px solid ${colors.white}`,
  },
};

export default function ActionButton({
  text,
  href,
  variant = "primary",
  caption,
}: ActionButtonProps) {
  const style = buttonStyles[variant];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          ...style,
          borderRadius: spacing.radius.container,
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          fontFamily: typography.fontFamily.primary,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "48px",
          padding: `${spacing.lg} ${spacing.xl}`,
          transition: "transform 0.2s ease",
        }}
      >
        {text}
      </a>
      {caption && (
        <div style={{ marginTop: spacing.lg }}>
          <span
            style={{
              fontSize: typography.fontSize.sm,
              color:
                variant === "primary"
                  ? colors.text.secondary
                  : colors.text.inverse,
              fontFamily: typography.fontFamily.body,
              textAlign: "center",
            }}
          >
            {caption}
          </span>
        </div>
      )}
    </div>
  );
}

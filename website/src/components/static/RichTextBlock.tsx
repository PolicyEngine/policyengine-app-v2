import { ReactNode } from "react";
import { colors, typography } from "@policyengine/design-system/tokens";

export interface RichTextBlockProps {
  children: ReactNode;
  variant?: "default" | "inverted";
}

export default function RichTextBlock({
  children,
  variant = "default",
}: RichTextBlockProps) {
  const textColor =
    variant === "inverted" ? colors.text.inverse : colors.text.primary;
  const linkColor =
    variant === "inverted" ? colors.text.inverse : colors.primary[600];
  const linkHoverColor =
    variant === "inverted" ? colors.text.inverse : colors.primary[700];

  return (
    <>
      <style>{`
        .rich-text-block p {
          font-family: ${typography.fontFamily.body};
          font-size: 16px;
          line-height: 1.625;
          margin-bottom: 16px;
          margin-top: 0;
        }
        .rich-text-block p:last-child {
          margin-bottom: 0;
        }
        .rich-text-block a {
          color: var(--rtb-link-color);
          text-decoration: underline;
          transition: opacity 0.2s ease;
        }
        .rich-text-block a:hover {
          color: var(--rtb-link-hover-color);
        }
      `}</style>
      <div
        className="rich-text-block"
        style={
          {
            color: textColor,
            "--rtb-link-color": linkColor,
            "--rtb-link-hover-color": linkHoverColor,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </>
  );
}

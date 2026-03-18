import { ReactNode } from "react";
import { colors } from "@policyengine/design-system/tokens";

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
    variant === "inverted" ? colors.text.inverse : colors.primary[500];

  return (
    <>
      <style>{`
        .rich-text-block p {
          font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
          opacity: 0.8;
        }
      `}</style>
      <div
        className="rich-text-block"
        style={
          {
            color: textColor,
            "--rtb-link-color": linkColor,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </>
  );
}

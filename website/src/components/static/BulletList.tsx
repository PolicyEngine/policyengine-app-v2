import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

export interface BulletItem {
  title: string;
  description: string;
}

export interface BulletListProps {
  items: BulletItem[];
  variant?: "default" | "inverted";
}

export default function BulletList({
  items,
  variant = "default",
}: BulletListProps) {
  const textColor =
    variant === "inverted" ? colors.text.inverse : colors.text.primary;

  return (
    <ul
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        listStyle: "disc",
        paddingLeft: "24px",
        margin: 0,
      }}
    >
      {items.map((item, index) => (
        <li key={index}>
          <div style={{ marginTop: spacing.xs }}>
            <span
              style={{
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: textColor,
                display: "block",
                marginBottom: spacing.xs,
              }}
            >
              {item.title}
            </span>
            <span
              style={{
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
                color: textColor,
              }}
            >
              {item.description}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

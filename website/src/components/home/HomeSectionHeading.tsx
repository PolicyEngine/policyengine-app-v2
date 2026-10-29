import { colors, spacing, typography } from "@/designTokens";

/** A homepage section's title, styled like "Expert policy analysis". */
export default function HomeSectionHeading({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontWeight: typography.fontWeight.bold,
        fontSize: typography.fontSize["3xl"],
        color: colors.primary[800],
        fontFamily: typography.fontFamily.primary,
        lineHeight: typography.lineHeight.tight,
        margin: 0,
        marginBottom: spacing["3xl"],
      }}
    >
      {title}
    </h2>
  );
}

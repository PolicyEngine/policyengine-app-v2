import { colors } from "@policyengine/design-system/tokens";

export interface HeroSectionProps {
  title: string;
  description: string | React.ReactNode;
}

export default function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <div
      style={{
        padding: "56px 6.125% 56px",
        backgroundColor: colors.gray[50],
        borderBottom: `1px solid ${colors.border.light}`,
      }}
    >
      <h1
        style={{
          fontSize: "2.25rem",
          fontWeight: 700,
          letterSpacing: "-0.025em",
          color: colors.primary[800],
          margin: 0,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: "1.125rem",
          lineHeight: 1.625,
          marginTop: "16px",
          marginBottom: 0,
          color: colors.gray[500],
        }}
      >
        {description}
      </p>
    </div>
  );
}

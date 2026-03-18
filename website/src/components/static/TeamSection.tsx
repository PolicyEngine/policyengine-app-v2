import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";
import TeamMemberCard, { TeamMember } from "./TeamMemberCard";

export interface TeamSectionProps {
  title: string;
  members: TeamMember[];
  variant?: "primary" | "secondary" | "accent";
}

export default function TeamSection({
  title,
  members,
  variant = "primary",
}: TeamSectionProps) {
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

  const cardVariant = variant === "accent" ? "inverted" : "default";

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
        <h2
          style={{
            fontSize: typography.fontSize["3xl"],
            fontWeight: typography.fontWeight.semibold,
            fontFamily: typography.fontFamily.primary,
            color: textColors[variant],
            margin: 0,
          }}
        >
          {title}
        </h2>

        <div>
          {members.map((member) => (
            <TeamMemberCard
              key={member.name}
              member={member}
              variant={cardVariant}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

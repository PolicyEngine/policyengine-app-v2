import { colors } from "@policyengine/design-system/tokens";

export interface HeroSectionProps {
  title: string;
  description: string | React.ReactNode;
}

export default function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <div
      className="tw:px-[6.125%] tw:py-14 tw:md:py-20"
      style={{
        backgroundColor: colors.gray[50],
        borderBottom: `1px solid ${colors.border.light}`,
      }}
    >
      <h1
        className="tw:text-3xl tw:md:text-4xl tw:font-bold tw:tracking-tight"
        style={{ color: colors.primary[800] }}
      >
        {title}
      </h1>
      <p
        className="tw:text-base tw:md:text-lg tw:leading-relaxed tw:mt-4"
        style={{ color: colors.gray[500] }}
      >
        {description}
      </p>
    </div>
  );
}

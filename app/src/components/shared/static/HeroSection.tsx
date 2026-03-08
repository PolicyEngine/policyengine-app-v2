import { colors } from '@/designTokens';

export interface HeroSectionProps {
  title: string;
  description: string | React.ReactNode;
  /**
   * @deprecated 'light' variant is deprecated. Use 'default' instead.
   * @deprecated 'accent' variant is deprecated. Use 'dark' instead.
   */
  variant?: 'light' | 'default' | 'accent' | 'dark';
}

export default function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <div
      className="tw:px-[6.125%] tw:py-12 tw:md:py-16"
      style={{
        background: `linear-gradient(to right, ${colors.primary[800]}, ${colors.primary[600]})`,
      }}
    >
      <div className="tw:max-w-3xl">
        <h1 className="tw:text-3xl tw:md:text-4xl tw:font-semibold tw:text-white tw:tracking-tight">
          {title}
        </h1>
        <p className="tw:text-base tw:md:text-lg tw:leading-relaxed tw:text-white/75 tw:mt-3 tw:max-w-2xl">
          {description}
        </p>
      </div>
    </div>
  );
}

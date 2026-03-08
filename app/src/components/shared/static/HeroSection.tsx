import { cn } from '@/lib/utils';

export interface HeroSectionProps {
  title: string;
  description: string | React.ReactNode;
  /**
   * @deprecated 'light' variant is deprecated. Use 'default' instead.
   * @deprecated 'accent' variant is deprecated. Use 'dark' instead.
   */
  variant?: 'light' | 'default' | 'accent' | 'dark';
}

export default function HeroSection({ title, description, variant = 'default' }: HeroSectionProps) {
  const isDark = variant === 'accent' || variant === 'dark';

  return (
    <div
      className={cn(
        'tw:py-4xl tw:px-[6.125%] tw:border-b tw:border-border-dark',
        isDark ? 'tw:bg-primary-700' : 'tw:bg-[#F7FEFE]'
      )}
    >
      <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-stretch tw:md:items-center tw:gap-3 tw:md:gap-5">
        <div className="tw:w-full tw:md:w-[300px]">
          <h1
            className={cn(
              'tw:text-4xl tw:font-semibold',
              isDark ? 'tw:text-text-inverse' : 'tw:text-text-primary'
            )}
          >
            {title}
          </h1>
        </div>

        <hr
          className={cn('tw:md:hidden', isDark ? 'tw:border-white' : 'tw:border-border-dark')}
          style={{ borderWidth: '0.5px' }}
        />

        <div
          className={cn(
            'tw:hidden tw:md:block tw:self-stretch tw:border-l',
            isDark ? 'tw:border-white' : 'tw:border-border-dark'
          )}
        />

        <div className="tw:flex-1">
          <p
            className={cn(
              'tw:text-lg tw:leading-relaxed tw:text-left',
              isDark ? 'tw:text-text-inverse' : 'tw:text-text-primary'
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

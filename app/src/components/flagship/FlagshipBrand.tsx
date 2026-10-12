import { useAppNavigate } from '@/contexts/NavigationContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { cn } from '@/lib/utils';

const PolicyEngineLogo = '/assets/logos/policyengine/teal.svg';

interface FlagshipBrandProps {
  className?: string;
  style?: React.CSSProperties;
}

/** The flagship shell's logo: a way home to the Build landing. */
export default function FlagshipBrand({ className, style }: FlagshipBrandProps) {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();

  return (
    <button
      type="button"
      onClick={() => nav.push(`/${countryId}/build`)}
      aria-label="PolicyEngine"
      className={cn(
        'tw:flex tw:items-center tw:border-none tw:bg-transparent tw:cursor-pointer',
        className
      )}
      style={style}
    >
      <img src={PolicyEngineLogo} alt="PolicyEngine" style={{ height: 22, width: 'auto' }} />
    </button>
  );
}

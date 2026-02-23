import { IconWorld } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Text,
} from '@/components/ui';
import { colors, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const countries = [
  { id: 'us', label: 'United States' },
  { id: 'uk', label: 'United Kingdom' },
];

export default function CountrySelector() {
  const countryId = useCurrentCountry();
  const navigate = useNavigate();
  const location = useLocation();

  const handleCountryChange = (newCountryId: string) => {
    // Replace the country ID in the current path
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      pathParts[0] = newCountryId;
      navigate(`/${pathParts.join('/')}`);
    } else {
      navigate(`/${newCountryId}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="tw:bg-transparent tw:border-none tw:cursor-pointer tw:p-0 tw:leading-none"
          aria-label="Country selector"
        >
          <div className="tw:flex tw:items-center tw:gap-1">
            <IconWorld size={18} color={colors.text.inverse} />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="tw:w-[200px] tw:z-[1001]">
        {countries.map((country) => (
          <DropdownMenuItem
            key={country.id}
            onClick={() => handleCountryChange(country.id)}
            style={{
              fontFamily: typography.fontFamily.primary,
            }}
          >
            <Text
              fw={
                countryId === country.id ? typography.fontWeight.bold : typography.fontWeight.normal
              }
              style={{
                fontFamily: typography.fontFamily.primary,
              }}
            >
              {country.label}
            </Text>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

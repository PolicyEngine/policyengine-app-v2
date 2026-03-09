import { UKOutlineIcon, USOutlineIcon } from '@/components/icons/CountryOutlineIcons';

interface CountryMapIconProps {
  countryId: string;
  size: number;
  color: string;
}

export function CountryMapIcon({ countryId, size, color }: CountryMapIconProps) {
  if (countryId === 'uk') {
    return <UKOutlineIcon size={size} color={color} />;
  }
  return <USOutlineIcon size={size} color={color} />;
}

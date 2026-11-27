import { colors } from '@/designTokens';
import type { CountryId } from '@/libs/countries';
import { formatCurrency } from '@/utils/formatters';

/** Whole dollars (or pounds), with a true minus sign: "−$1,200", "−£1,200". */
export function money(value: number, countryId: CountryId): string {
  const rounded = Math.round(value);
  const text = formatCurrency(Math.abs(rounded), countryId, { maximumFractionDigits: 0 });
  return rounded < 0 ? `−${text}` : text;
}

/** A change, always signed: "+$1,200", "−$300", "$0". */
export function signedMoney(value: number, countryId: CountryId): string {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${money(rounded, countryId)}` : money(rounded, countryId);
}

/** Gains read in the brand teal, losses in red. */
export const effectColor = (effect: number) =>
  Math.round(effect) > 0
    ? colors.primary[700]
    : Math.round(effect) < 0
      ? colors.error
      : colors.text.primary;

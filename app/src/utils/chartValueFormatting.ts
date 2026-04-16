import { countryIds } from '@/libs/countries';
import { formatCurrency, formatNumber, formatPercent } from './formatters';

type CountryId = (typeof countryIds)[number];

export function getVariableChartPrecision(variable: any): number {
  if (variable?.unit === '/1') {
    return 1;
  }

  if (variable?.valueType === 'float' && !String(variable?.unit ?? '').startsWith('currency-')) {
    return 1;
  }

  return 0;
}

export function formatChartValueForVariable(
  value: number,
  variable: any,
  countryId: CountryId,
  precision = getVariableChartPrecision(variable)
): string {
  if (variable?.unit === '/1') {
    return formatPercent(value, countryId, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  }

  if (String(variable?.unit ?? '').startsWith('currency-')) {
    return formatCurrency(value, countryId, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  }

  return formatNumber(value, countryId, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

export function formatEmploymentIncomeValue(value: number, countryId: CountryId): string {
  return formatCurrency(value, countryId, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

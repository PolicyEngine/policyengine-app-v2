import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Stack, Text, Title } from '@mantine/core';
import {
  buildDistrictLabelLookup,
  transformDistrictAverageChange,
} from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { USDistrictChoroplethMap } from '@/components/visualization/USDistrictChoroplethMap';
import type { RootState } from '@/store';
import type { USCongressionalDistrictBreakdown } from '@/types/metadata/ReportOutputSocietyWideByCongressionalDistrict';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

// TODO: Remove this mock data after API integration is complete
// Mostly positive values for better demo appearance
const MOCK_DISTRICT_DATA: USCongressionalDistrictBreakdown = {
  districts: [
    // Alabama - all positive
    {
      district: 'AL-01',
      average_household_income_change: 312.45,
      relative_household_income_change: 0.0187,
    },
    {
      district: 'AL-02',
      average_household_income_change: 245.3,
      relative_household_income_change: 0.0148,
    },
    {
      district: 'AL-03',
      average_household_income_change: 278.9,
      relative_household_income_change: 0.0156,
    },
    {
      district: 'AL-04',
      average_household_income_change: 189.2,
      relative_household_income_change: 0.0112,
    },
    {
      district: 'AL-05',
      average_household_income_change: 167.8,
      relative_household_income_change: 0.0095,
    },
    {
      district: 'AL-06',
      average_household_income_change: 423.15,
      relative_household_income_change: 0.0234,
    },
    {
      district: 'AL-07',
      average_household_income_change: 567.9,
      relative_household_income_change: 0.0389,
    },
    // Alaska - positive
    {
      district: 'AK-01',
      average_household_income_change: 334.5,
      relative_household_income_change: 0.0196,
    },
    // Arizona - mostly positive
    {
      district: 'AZ-01',
      average_household_income_change: 256.78,
      relative_household_income_change: 0.0148,
    },
    {
      district: 'AZ-02',
      average_household_income_change: 189.45,
      relative_household_income_change: 0.0106,
    },
    {
      district: 'AZ-03',
      average_household_income_change: 345.67,
      relative_household_income_change: 0.0212,
    },
    {
      district: 'AZ-04',
      average_household_income_change: 278.9,
      relative_household_income_change: 0.0163,
    },
    {
      district: 'AZ-05',
      average_household_income_change: 234.56,
      relative_household_income_change: 0.0145,
    },
    {
      district: 'AZ-06',
      average_household_income_change: 189.12,
      relative_household_income_change: 0.0107,
    },
    {
      district: 'AZ-07',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0298,
    },
    {
      district: 'AZ-08',
      average_household_income_change: 156.34,
      relative_household_income_change: 0.0094,
    },
    {
      district: 'AZ-09',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    // California - mostly positive with varied intensities
    {
      district: 'CA-01',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    {
      district: 'CA-02',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0345,
    },
    {
      district: 'CA-03',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'CA-04',
      average_household_income_change: 145.67,
      relative_household_income_change: 0.0084,
    },
    {
      district: 'CA-05',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0289,
    },
    {
      district: 'CA-06',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0129,
    },
    {
      district: 'CA-07',
      average_household_income_change: 189.12,
      relative_household_income_change: 0.0106,
    },
    {
      district: 'CA-08',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0412,
    },
    {
      district: 'CA-09',
      average_household_income_change: 345.67,
      relative_household_income_change: 0.0223,
    },
    {
      district: 'CA-10',
      average_household_income_change: 134.56,
      relative_household_income_change: 0.0077,
    },
    {
      district: 'CA-11',
      average_household_income_change: 512.34,
      relative_household_income_change: 0.0312,
    },
    {
      district: 'CA-12',
      average_household_income_change: 789.01,
      relative_household_income_change: 0.0456,
    },
    {
      district: 'CA-13',
      average_household_income_change: 267.89,
      relative_household_income_change: 0.0152,
    },
    {
      district: 'CA-14',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0195,
    },
    {
      district: 'CA-15',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0278,
    },
    {
      district: 'CA-16',
      average_household_income_change: 178.9,
      relative_household_income_change: 0.0105,
    },
    {
      district: 'CA-17',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0334,
    },
    {
      district: 'CA-18',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    {
      district: 'CA-19',
      average_household_income_change: 389.01,
      relative_household_income_change: 0.0229,
    },
    {
      district: 'CA-20',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0262,
    },
    {
      district: 'CA-21',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0423,
    },
    {
      district: 'CA-22',
      average_household_income_change: 245.67,
      relative_household_income_change: 0.0148,
    },
    {
      district: 'CA-23',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'CA-24',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0267,
    },
    {
      district: 'CA-25',
      average_household_income_change: 156.78,
      relative_household_income_change: 0.0094,
    },
    {
      district: 'CA-26',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0345,
    },
    {
      district: 'CA-27',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0129,
    },
    {
      district: 'CA-28',
      average_household_income_change: 278.9,
      relative_household_income_change: 0.0163,
    },
    {
      district: 'CA-29',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0261,
    },
    {
      district: 'CA-30',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0398,
    },
    {
      district: 'CA-31',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'CA-32',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0289,
    },
    {
      district: 'CA-33',
      average_household_income_change: 789.01,
      relative_household_income_change: 0.0467,
    },
    {
      district: 'CA-34',
      average_household_income_change: 189.12,
      relative_household_income_change: 0.0106,
    },
    {
      district: 'CA-35',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0195,
    },
    {
      district: 'CA-36',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0334,
    },
    {
      district: 'CA-37',
      average_household_income_change: 267.89,
      relative_household_income_change: 0.0152,
    },
    {
      district: 'CA-38',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0262,
    },
    {
      district: 'CA-39',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0401,
    },
    {
      district: 'CA-40',
      average_household_income_change: 178.9,
      relative_household_income_change: 0.0105,
    },
    {
      district: 'CA-41',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0278,
    },
    {
      district: 'CA-42',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    {
      district: 'CA-43',
      average_household_income_change: 389.01,
      relative_household_income_change: 0.0229,
    },
    {
      district: 'CA-44',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0356,
    },
    {
      district: 'CA-45',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0195,
    },
    {
      district: 'CA-46',
      average_household_income_change: 245.67,
      relative_household_income_change: 0.0148,
    },
    {
      district: 'CA-47',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0263,
    },
    {
      district: 'CA-48',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0412,
    },
    {
      district: 'CA-49',
      average_household_income_change: 156.78,
      relative_household_income_change: 0.0094,
    },
    {
      district: 'CA-50',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0289,
    },
    {
      district: 'CA-51',
      average_household_income_change: 789.01,
      relative_household_income_change: 0.0478,
    },
    {
      district: 'CA-52',
      average_household_income_change: 278.9,
      relative_household_income_change: 0.0162,
    },
    // Colorado - all positive
    {
      district: 'CO-01',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0278,
    },
    {
      district: 'CO-02',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'CO-03',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0129,
    },
    {
      district: 'CO-04',
      average_household_income_change: 345.67,
      relative_household_income_change: 0.0212,
    },
    {
      district: 'CO-05',
      average_household_income_change: 189.12,
      relative_household_income_change: 0.0106,
    },
    {
      district: 'CO-06',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0345,
    },
    {
      district: 'CO-07',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    {
      district: 'CO-08',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0197,
    },
    // Delaware - positive
    {
      district: 'DE-01',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0263,
    },
    // Florida - all positive
    {
      district: 'FL-01',
      average_household_income_change: 267.89,
      relative_household_income_change: 0.0152,
    },
    {
      district: 'FL-02',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0289,
    },
    {
      district: 'FL-03',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'FL-04',
      average_household_income_change: 178.9,
      relative_household_income_change: 0.0105,
    },
    {
      district: 'FL-05',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0356,
    },
    {
      district: 'FL-06',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0129,
    },
    {
      district: 'FL-07',
      average_household_income_change: 389.01,
      relative_household_income_change: 0.0229,
    },
    {
      district: 'FL-08',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0262,
    },
    {
      district: 'FL-09',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0423,
    },
    {
      district: 'FL-10',
      average_household_income_change: 245.67,
      relative_household_income_change: 0.0148,
    },
    {
      district: 'FL-11',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0195,
    },
    {
      district: 'FL-12',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0278,
    },
    {
      district: 'FL-13',
      average_household_income_change: 156.78,
      relative_household_income_change: 0.0094,
    },
    {
      district: 'FL-14',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0345,
    },
    {
      district: 'FL-15',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    {
      district: 'FL-16',
      average_household_income_change: 278.9,
      relative_household_income_change: 0.0163,
    },
    {
      district: 'FL-17',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0261,
    },
    {
      district: 'FL-18',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0398,
    },
    {
      district: 'FL-19',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'FL-20',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0289,
    },
    {
      district: 'FL-21',
      average_household_income_change: 789.01,
      relative_household_income_change: 0.0467,
    },
    {
      district: 'FL-22',
      average_household_income_change: 189.12,
      relative_household_income_change: 0.0106,
    },
    {
      district: 'FL-23',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0195,
    },
    {
      district: 'FL-24',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0334,
    },
    {
      district: 'FL-25',
      average_household_income_change: 267.89,
      relative_household_income_change: 0.0152,
    },
    {
      district: 'FL-26',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0262,
    },
    {
      district: 'FL-27',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0401,
    },
    {
      district: 'FL-28',
      average_household_income_change: 178.9,
      relative_household_income_change: 0.0105,
    },
    // Georgia - all positive
    {
      district: 'GA-01',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'GA-02',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0378,
    },
    {
      district: 'GA-03',
      average_household_income_change: 245.67,
      relative_household_income_change: 0.0148,
    },
    {
      district: 'GA-04',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0289,
    },
    {
      district: 'GA-05',
      average_household_income_change: 789.01,
      relative_household_income_change: 0.0489,
    },
    {
      district: 'GA-06',
      average_household_income_change: 156.78,
      relative_household_income_change: 0.0094,
    },
    {
      district: 'GA-07',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0262,
    },
    {
      district: 'GA-08',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    {
      district: 'GA-09',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0197,
    },
    {
      district: 'GA-10',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0278,
    },
    {
      district: 'GA-11',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0195,
    },
    {
      district: 'GA-12',
      average_household_income_change: 189.12,
      relative_household_income_change: 0.0106,
    },
    {
      district: 'GA-13',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0356,
    },
    {
      district: 'GA-14',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0263,
    },
    // New York - all positive
    {
      district: 'NY-01',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0195,
    },
    {
      district: 'NY-02',
      average_household_income_change: 278.9,
      relative_household_income_change: 0.0162,
    },
    {
      district: 'NY-03',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0278,
    },
    {
      district: 'NY-04',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0334,
    },
    {
      district: 'NY-05',
      average_household_income_change: 189.12,
      relative_household_income_change: 0.0106,
    },
    {
      district: 'NY-06',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0412,
    },
    {
      district: 'NY-07',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0262,
    },
    {
      district: 'NY-08',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'NY-09',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0289,
    },
    {
      district: 'NY-10',
      average_household_income_change: 789.01,
      relative_household_income_change: 0.0467,
    },
    {
      district: 'NY-11',
      average_household_income_change: 245.67,
      relative_household_income_change: 0.0148,
    },
    {
      district: 'NY-12',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0345,
    },
    {
      district: 'NY-13',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'NY-14',
      average_household_income_change: 156.78,
      relative_household_income_change: 0.0094,
    },
    {
      district: 'NY-15',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0423,
    },
    {
      district: 'NY-16',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0261,
    },
    {
      district: 'NY-17',
      average_household_income_change: 267.89,
      relative_household_income_change: 0.0152,
    },
    {
      district: 'NY-18',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0267,
    },
    {
      district: 'NY-19',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    {
      district: 'NY-20',
      average_household_income_change: 389.01,
      relative_household_income_change: 0.0229,
    },
    {
      district: 'NY-21',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0195,
    },
    {
      district: 'NY-22',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0356,
    },
    {
      district: 'NY-23',
      average_household_income_change: 178.9,
      relative_household_income_change: 0.0105,
    },
    {
      district: 'NY-24',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0263,
    },
    {
      district: 'NY-25',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0398,
    },
    {
      district: 'NY-26',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0129,
    },
    // Texas - all positive
    {
      district: 'TX-01',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0195,
    },
    {
      district: 'TX-02',
      average_household_income_change: 267.89,
      relative_household_income_change: 0.0152,
    },
    {
      district: 'TX-03',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0278,
    },
    {
      district: 'TX-04',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0262,
    },
    {
      district: 'TX-05',
      average_household_income_change: 189.12,
      relative_household_income_change: 0.0106,
    },
    {
      district: 'TX-06',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0345,
    },
    {
      district: 'TX-07',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0412,
    },
    {
      district: 'TX-08',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'TX-09',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0289,
    },
    {
      district: 'TX-10',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    {
      district: 'TX-11',
      average_household_income_change: 245.67,
      relative_household_income_change: 0.0148,
    },
    {
      district: 'TX-12',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0261,
    },
    {
      district: 'TX-13',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0356,
    },
    {
      district: 'TX-14',
      average_household_income_change: 156.78,
      relative_household_income_change: 0.0094,
    },
    {
      district: 'TX-15',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'TX-16',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0423,
    },
    {
      district: 'TX-17',
      average_household_income_change: 278.9,
      relative_household_income_change: 0.0163,
    },
    {
      district: 'TX-18',
      average_household_income_change: 789.01,
      relative_household_income_change: 0.0489,
    },
    {
      district: 'TX-19',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0262,
    },
    {
      district: 'TX-20',
      average_household_income_change: 389.01,
      relative_household_income_change: 0.0229,
    },
    {
      district: 'TX-21',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0267,
    },
    {
      district: 'TX-22',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0195,
    },
    {
      district: 'TX-23',
      average_household_income_change: 178.9,
      relative_household_income_change: 0.0105,
    },
    {
      district: 'TX-24',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0334,
    },
    {
      district: 'TX-25',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0129,
    },
    {
      district: 'TX-26',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    {
      district: 'TX-27',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0263,
    },
    {
      district: 'TX-28',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0401,
    },
    {
      district: 'TX-29',
      average_household_income_change: 267.89,
      relative_household_income_change: 0.0152,
    },
    {
      district: 'TX-30',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0289,
    },
    {
      district: 'TX-31',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'TX-32',
      average_household_income_change: 189.12,
      relative_household_income_change: 0.0106,
    },
    {
      district: 'TX-33',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0356,
    },
    {
      district: 'TX-34',
      average_household_income_change: 445.67,
      relative_household_income_change: 0.0262,
    },
    {
      district: 'TX-35',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0197,
    },
    {
      district: 'TX-36',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0278,
    },
    {
      district: 'TX-37',
      average_household_income_change: 678.9,
      relative_household_income_change: 0.0412,
    },
    {
      district: 'TX-38',
      average_household_income_change: 156.78,
      relative_household_income_change: 0.0094,
    },
    // At-large states - all positive
    {
      district: 'ND-01',
      average_household_income_change: 334.56,
      relative_household_income_change: 0.0196,
    },
    {
      district: 'SD-01',
      average_household_income_change: 245.67,
      relative_household_income_change: 0.0148,
    },
    {
      district: 'VT-01',
      average_household_income_change: 456.78,
      relative_household_income_change: 0.0289,
    },
    {
      district: 'WY-01',
      average_household_income_change: 223.45,
      relative_household_income_change: 0.0128,
    },
    {
      district: 'DC-01',
      average_household_income_change: 567.89,
      relative_household_income_change: 0.0345,
    },
  ],
};

interface AbsoluteChangeByDistrictProps {
  output: SocietyWideReportOutput;
}

/**
 * Absolute household income change by congressional district
 *
 * Displays a geographic choropleth map showing the absolute household income change
 * for each US congressional district in currency terms.
 */
export function AbsoluteChangeByDistrict({ output }: AbsoluteChangeByDistrictProps) {
  // Get district labels from metadata
  const regions = useSelector((state: RootState) => state.metadata.economyOptions.region);

  // Build label lookup from metadata (memoized)
  const labelLookup = useMemo(() => buildDistrictLabelLookup(regions), [regions]);

  // Transform API data to choropleth map format
  const mapData = useMemo(() => {
    // Type guard to ensure output is US report with district data
    if (!('congressional_district_impact' in output)) {
      return transformDistrictAverageChange(MOCK_DISTRICT_DATA, labelLookup);
    }
    const districtData = (output as ReportOutputSocietyWideUS).congressional_district_impact;
    if (!districtData) {
      return transformDistrictAverageChange(MOCK_DISTRICT_DATA, labelLookup);
    }
    return transformDistrictAverageChange(districtData, labelLookup);
  }, [output, labelLookup]);

  if (!mapData.length) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Text c="dimmed">No congressional district data available</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Absolute household income change by congressional district</Title>
      </div>

      <USDistrictChoroplethMap
        data={mapData}
        config={{
          colorScale: {
            colors: DIVERGING_GRAY_TEAL.colors,
            tickFormat: '$,.0f',
            symmetric: true,
          },
          formatValue: (value) =>
            formatParameterValue(value, 'currency-USD', {
              decimalPlaces: 0,
              includeSymbol: true,
            }),
        }}
      />
    </Stack>
  );
}

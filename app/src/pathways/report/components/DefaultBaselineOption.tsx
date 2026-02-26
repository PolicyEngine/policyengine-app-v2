/**
 * DefaultBaselineOption - Option card for selecting default baseline simulation
 *
 * This is a selectable card that renders an option for "Current law + Nationwide population"
 * as a quick-select for the baseline simulation in a report.
 *
 * Unlike other cards, this one doesn't navigate anywhere - it just marks itself as selected
 * and the parent view handles creation when "Next" is clicked.
 */

import { IconChevronRight } from '@tabler/icons-react';
import { Card, CardContent } from '@/components/ui';
import { getDefaultBaselineLabel } from '@/utils/isDefaultBaselineSimulation';

interface DefaultBaselineOptionProps {
  countryId: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function DefaultBaselineOption({
  countryId,
  isSelected,
  onClick,
}: DefaultBaselineOptionProps) {
  const simulationLabel = getDefaultBaselineLabel(countryId);

  return (
    <Card
      className={`tw:cursor-pointer tw:border ${isSelected ? 'tw:border-primary-500 tw:bg-primary-50' : 'tw:border-gray-200'}`}
      onClick={onClick}
    >
      <CardContent className="tw:p-lg">
        <div className="tw:flex tw:justify-between tw:items-center">
          <div className="tw:flex tw:flex-col tw:gap-xs tw:flex-1">
            <span className="tw:font-bold">{simulationLabel}</span>
            <span className="tw:text-sm tw:text-gray-500">
              Use current law with all households nationwide as baseline
            </span>
          </div>
          <IconChevronRight
            size={20}
            className="tw:text-gray-400 tw:shrink-0"
            style={{ marginTop: '2px' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

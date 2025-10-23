import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  BulletsValue,
  ColumnConfig,
  IngredientRecord,
  LinkValue,
  TextValue,
} from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { OutputTypeCell } from '@/components/report/OutputTypeCell';
import { MOCK_USER_ID } from '@/constants';
import { ReportCreationFlow } from '@/flows/reportCreationFlow';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUserReports } from '@/hooks/useUserReports';
import { setFlow } from '@/reducers/flowReducer';
import { useCacheMonitor } from '@/utils/cacheMonitor';
import { formatDate } from '@/utils/dateUtils';

export default function ReportsPage() {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserReports(userId);
  const cacheMonitor = useCacheMonitor();

  // Log cache state when component mounts and when data changes
  useEffect(() => {
    console.log('📊 [ReportsPage] Component mounted/updated');
    cacheMonitor.getStats();
  }, [data]);
  const dispatch = useDispatch();
  const countryId = useCurrentCountry();

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleBuildReport = () => {
    dispatch(setFlow(ReportCreationFlow));
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  const handleSelectionChange = (recordId: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, recordId] : prev.filter((id) => id !== recordId)
    );
  };

  const isSelected = (recordId: string) => selectedIds.includes(recordId);

  // Helper function to format status text
  const formatStatus = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Define column configurations for reports
  const reportColumns: ColumnConfig[] = [
    {
      key: 'report',
      header: 'Report',
      type: 'link',
    },
    {
      key: 'dateCreated',
      header: 'Date Created',
      type: 'text',
    },
    {
      key: 'status',
      header: 'Status',
      type: 'text',
    },
    {
      key: 'simulations',
      header: 'Simulations',
      type: 'bullets',
      items: [
        {
          textKey: 'text',
          badgeKey: 'badge',
        },
      ],
    },
    {
      key: 'outputType',
      header: 'Output Type',
      type: 'text',
    },
  ];

  console.log('User Reports Data:', data);

  // Transform the data to match the new structure
  // Use useMemo to prevent unnecessary re-creation of data objects
  const transformedData: IngredientRecord[] = useMemo(
    () =>
      data?.map((item) => {
        const simulationIds =
          (item.simulations?.map((s) => s.id).filter(Boolean) as string[]) || [];
        const isHouseholdReport = item.simulations?.[0]?.populationType === 'household';

        return {
          id: item.userReport.id,
          report: {
            text: item.userReport.label || `Report #${item.userReport.reportId}`,
            url: `/${countryId}/report-output/${item.userReport.id}`,
          } as LinkValue,
          dateCreated: {
            text: item.userReport.createdAt
              ? formatDate(
                  item.userReport.createdAt,
                  'short-month-day-year',
                  item.userReport.countryId,
                  true
                )
              : '',
          } as TextValue,
          status: {
            text: formatStatus(item.report?.status || 'initializing'),
          } as TextValue,
          simulations: {
            items: item.simulations?.map((sim, index) => ({
              text: item.userSimulations?.[index]?.label || `Simulation #${sim.id}`,
            })) || [
              {
                text: 'No simulations',
              },
            ],
          } as BulletsValue,
          // Use OutputTypeCell component with CalcStatus subscription
          // This cell will re-render independently when its CalcStatus updates
          outputType: {
            custom: (
              <OutputTypeCell
                simulationIds={simulationIds}
                isHouseholdReport={isHouseholdReport}
                simulations={item.simulations}
                report={item.report}
              />
            ),
          },
        };
      }) || [],
    [data, countryId]
  );

  return (
    <IngredientReadView
      ingredient="report"
      title="Your saved reports"
      subtitle="Generate comprehensive impact analyses comparing tax policy scenarios. Reports show distributional effects, budget impacts, and poverty outcomes across demographics"
      onBuild={handleBuildReport}
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={transformedData}
      columns={reportColumns}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onMoreFilters={handleMoreFilters}
      enableSelection
      isSelected={isSelected}
      onSelectionChange={handleSelectionChange}
    />
  );
}

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BulletsValue,
  ColumnConfig,
  IngredientRecord,
  LinkValue,
  TextValue,
} from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { MOCK_USER_ID } from '@/constants';
import { ReportCreationFlow } from '@/flows/reportCreationFlow';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { usePendingReportsMonitor } from '@/hooks/usePendingReportsMonitor';
import { useUserReports } from '@/hooks/useUserReports';
import { countryIds } from '@/libs/countries';
import { setFlow } from '@/reducers/flowReducer';
import { formatDate } from '@/utils/dateUtils';

export default function ReportsPage() {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserReports(userId);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const countryId = useCurrentCountry();
  const queryClient = useQueryClient();

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Monitor pending reports and auto-refresh when they complete
  const reports = data?.map((item) => ({ id: item.report?.id, status: item.report?.status }));
  usePendingReportsMonitor(reports, countryId);

  const handleBuildReport = () => {
    dispatch(setFlow(ReportCreationFlow));
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  const handleMenuAction = (action: string, recordId: string) => {
    switch (action) {
      case 'view-output':
        // recordId is now the UserReport.id
        navigate(`/${countryId}/report-output/${recordId}`);
        break;
      case 'export':
        // TODO: Implement export functionality
        console.log('Export report:', recordId);
        break;
      case 'share':
        // TODO: Implement share functionality
        console.log('Share report:', recordId);
        break;
      case 'duplicate':
        // TODO: Implement duplicate functionality
        console.log('Duplicate report:', recordId);
        break;
      case 'delete':
        // TODO: Implement delete functionality
        console.log('Delete report:', recordId);
        break;
      default:
        console.log('Unknown action:', action);
    }
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
    {
      key: 'actions',
      header: '',
      type: 'split-menu',
      actions: [
        { label: 'View Output', action: 'view-output' },
        { label: 'Export', action: 'export' },
        { label: 'Share', action: 'share' },
        { label: 'Duplicate', action: 'duplicate' },
        { label: 'Delete', action: 'delete', color: 'red' },
      ],
      onAction: handleMenuAction,
    },
  ];

  console.log('User Reports Data:', data);

  // Transform the data to match the new structure
  const transformedData: IngredientRecord[] =
    data?.map((item) => {
      // Debug logging for population type
      const firstSim = item.simulations?.[0];
      console.log('[Reports.page] Report:', item.userReport.id);
      console.log('  - First simulation:', firstSim);
      console.log('  - Population type:', firstSim?.populationType);
      console.log('  - Has output:', !!item.report?.output);

      // Determine report type
      let reportType = 'Not generated';
      if (item.report?.output) {
        if (firstSim?.populationType === 'household') {
          reportType = 'Household';
        } else if (firstSim?.populationType === 'geography') {
          reportType = 'Society-wide';
        } else {
          // Fallback: if no populationType, show empty string
          console.warn(
            '[Reports.page] No populationType found for simulation, defaulting to empty string'
          );
          reportType = '';
        }
      }

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
                (item.report?.countryId || 'us') as (typeof countryIds)[number],
                true
              )
            : '',
        } as TextValue,
        status: {
          text: formatStatus(item.report?.status || 'pending'),
          loading: item.report?.status === 'pending',
        } as TextValue,
        simulations: {
          items: item.simulations?.map((sim, index) => ({
            text: item.userSimulations?.[index]?.label || `Simulation #${sim.id}`,
            badge: item.userPolicies?.find((p) => p.policyId === sim.policyId)?.label ? 1 : 0,
          })) || [
            {
              text: 'No simulations',
              badge: 0,
            },
          ],
        } as BulletsValue,
        outputType: {
          text: reportType,
        } as TextValue,
      };
    }) || [];

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

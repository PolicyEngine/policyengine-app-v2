import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
import { useUserReports } from '@/hooks/useUserReports';
import { useReportLoadingStatus } from '@/hooks/useReportLoadingStatus';
import { countryIds } from '@/libs/countries';
import { calculationQueries } from '@/libs/queryOptions/calculations';
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

  // Monitor pending reports and invalidate queries when they complete
  useEffect(() => {
    if (!data) return;

    // Find all pending reports
    const pendingReportIds = data
      .filter((item) => item.report?.status === 'pending')
      .map((item) => item.report?.id)
      .filter((id): id is string => !!id);

    if (pendingReportIds.length === 0) return;

    // Ensure calculation queries are started for all pending reports
    // This triggers the polling mechanism in calculationQueries
    pendingReportIds.forEach((reportId) => {
      queryClient.prefetchQuery(calculationQueries.forReport(reportId, undefined, queryClient, countryId));
    });

    // Subscribe to query cache updates for all pending reports
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.query.queryKey[0] === 'calculation' &&
        pendingReportIds.includes(event.query.queryKey[1] as string)
      ) {
        const calculationData = event.query.state.data as any;

        // If a pending report just completed, invalidate the reports list
        if (calculationData?.status === 'ok' || calculationData?.status === 'error') {
          console.log('Report completed, invalidating reports list');
          queryClient.invalidateQueries({ queryKey: ['report'] });
          queryClient.invalidateQueries({ queryKey: ['user-report'] });
        }
      }
    });

    return unsubscribe;
  }, [data, queryClient]);

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
    data?.map((item) => ({
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
              (item.report?.countryId || countryId) as (typeof countryIds)[number],
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
        })) || [
          {
            text: 'No simulations',
          },
        ],
      } as BulletsValue,
      outputType: {
        text: item.report?.output
          ? item.simulations?.[0]?.populationType === 'household'
            ? 'Household'
            : 'Society-wide'
          : 'Not generated',
      } as TextValue,
    })) || [];

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

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsAPI } from '@/api/v2/reports';
import { BulletsValue, ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';
import { formatIngredientDate } from '@/utils/ingredientUtils';

export default function ReportsPage() {
  const [searchValue, setSearchValue] = useState('');
  const queryClient = useQueryClient();
  const { selectedIds, handleSelectionChange, isSelected } = useIngredientSelection();

  // Fetch reports from API
  const {
    data: reports,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsAPI.list({ limit: 1000 }),
    refetchInterval: 30000,
    retry: false, // Don't retry if endpoint doesn't exist yet
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: reportsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const { handleMenuAction } = useIngredientActions({
    ingredient: 'report' as any,
    onDelete: (id) => {
      if (confirm('Delete this report?')) {
        deleteMutation.mutate(id);
      }
    },
  });

  const handleBuildReport = () => {
    // TODO: Implement report generation flow
    console.log('Generate new report');
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  // Filter reports based on search
  const filteredReports = reports?.filter(
    (report) =>
      report.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      report.id.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'processing':
        return 'blue';
      case 'pending':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'processing':
        return '⏱';
      default:
        return '';
    }
  };

  // Define column configurations for reports
  const reportColumns: ColumnConfig[] = [
    {
      key: 'reportName',
      header: 'Report name',
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
      key: 'status',
      header: 'Status',
      type: 'bullets',
      items: [
        {
          textKey: 'text',
          badgeKey: 'badge',
        },
      ],
    },
    {
      key: 'dateCreated',
      header: 'Date created',
      type: 'text',
    },
    {
      key: 'actions',
      header: '',
      type: 'split-menu',
      actions: [
        { label: 'View report', action: 'view-report' },
        { label: 'Download', action: 'download' },
        { label: 'Share', action: 'share' },
        { label: 'Delete', action: 'delete', color: 'red' },
      ],
      onAction: handleMenuAction,
    },
  ];

  // Transform the data to match the IngredientRecord structure
  const transformedData: IngredientRecord[] =
    filteredReports?.map((report) => ({
      id: report.id,
      reportName: {
        text: report.name || `Report #${report.id.slice(0, 8)}`,
      } as TextValue,
      simulations: {
        items: [
          {
            text: `${report.simulation_ids.length} simulation${
              report.simulation_ids.length !== 1 ? 's' : ''
            }`,
            badge: '',
          },
        ],
      } as BulletsValue,
      status: {
        items: [
          {
            text: report.status.charAt(0).toUpperCase() + report.status.slice(1),
            badge: getStatusIcon(report.status),
          },
        ],
      } as BulletsValue,
      dateCreated: {
        text: formatIngredientDate(report.created_at),
      } as TextValue,
    })) || [];

  // Custom error handling for API not ready
  if (error) {
    return (
      <IngredientReadView
        ingredient="report"
        title="Your reports"
        subtitle="View and generate analysis reports from your simulation results."
        onBuild={handleBuildReport}
        isLoading={false}
        isError={false}
        error={null}
        data={[]}
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

  return (
    <IngredientReadView
      ingredient="report"
      title="Your reports"
      subtitle="View and generate analysis reports from your simulation results."
      onBuild={handleBuildReport}
      isLoading={isLoading}
      isError={!!error}
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

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import ReportCreationModal from '@/components/report/ReportCreationModal';
import { reportsAPI } from '@/api/v2/reports';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';

export default function ReportsPage() {
  const [searchValue, setSearchValue] = useState('');
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { handleSelectionChange, isSelected } = useIngredientSelection();

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

  const { handleMenuAction, getDefaultActions } = useIngredientActions({
    ingredient: 'report',
    onEdit: (id) => {
      // Navigate to report editor - use absolute path
      const currentPath = window.location.pathname;
      const countryMatch = currentPath.match(/^\/([^\/]+)/);
      if (countryMatch) {
        navigate(`/${countryMatch[1]}/reports/${id}/edit`);
      }
    },
    onDelete: (id) => {
      if (confirm('Delete this report?')) {
        deleteMutation.mutate(id);
      }
    },
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: reportsAPI.create,
    onSuccess: (newReport) => {
      // Navigate to the report editor - use absolute path
      const currentPath = window.location.pathname;
      const countryMatch = currentPath.match(/^\/([^\/]+)/);
      if (countryMatch) {
        navigate(`/${countryMatch[1]}/reports/${newReport.id}/edit`);
      }
    },
    onError: (error) => {
      console.error('Failed to create report:', error);
      alert('Failed to create report. Please try again.');
    },
  });

  const handleBuildReport = () => {
    setCreateModalOpened(true);
  };

  const handleCreateReport = (data: { label: string; description?: string }) => {
    createReportMutation.mutate({
      label: data.label,
      description: data.description,
      simulation_ids: [], // Start with no simulations
    });
    setCreateModalOpened(false);
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  // Filter reports based on search
  const filteredReports = reports?.filter(
    (report) =>
      report.label?.toLowerCase().includes(searchValue.toLowerCase()) ||
      report.id.toLowerCase().includes(searchValue.toLowerCase())
  );


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
      type: 'text',
    },
    {
      key: 'status',
      header: 'Status',
      type: 'text',
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
      actions: getDefaultActions(),
      onAction: handleMenuAction,
    },
  ];

  // Transform the data to match the IngredientRecord structure
  const transformedData: IngredientRecord[] =
    filteredReports?.map((report) => ({
      id: report.id,
      reportName: {
        text: report.label || `Report #${report.id.slice(0, 8)}`,
      } as TextValue,
      simulations: {
        text: report.simulation_ids ? `${report.simulation_ids.length} simulation${
          report.simulation_ids.length !== 1 ? 's' : ''
        }` : '0 simulations',
      } as TextValue,
      status: {
        text: report.status ? report.status.charAt(0).toUpperCase() + report.status.slice(1) : 'Draft',
      } as TextValue,
      dateCreated: {
        text: moment(report.created_at).fromNow(),
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
    <>
      <ReportCreationModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        onSubmit={handleCreateReport}
        isLoading={createReportMutation.isPending}
      />
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
    </>
  );
}

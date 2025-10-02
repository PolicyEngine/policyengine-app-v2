import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import ReportCreationModal from '@/components/report/ReportCreationModal';
import ReportRenameModal from '@/components/report/ReportRenameModal';
import { reportsAPI } from '@/api/v2/reports';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';

export default function ReportsPage() {
  const [searchValue, setSearchValue] = useState('');
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [renameModalOpened, setRenameModalOpened] = useState(false);
  const [reportToRename, setReportToRename] = useState<{ id: string; name: string } | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { countryId } = useParams<{ countryId: string }>();
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

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      reportsAPI.update(id, { label: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setRenameModalOpened(false);
      setReportToRename(null);
    },
  });

  const { handleMenuAction, getDefaultActions } = useIngredientActions({
    ingredient: 'report',
    onEdit: (id) => {
      navigate(`/${countryId}/report/${id}`);
    },
    onRename: (id) => {
      const report = reports?.find(r => r.id === id);
      if (report) {
        setReportToRename({ id, name: report.label || `Report #${id.slice(0, 8)}` });
        setRenameModalOpened(true);
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
      navigate(`/${countryId}/report/${newReport.id}`);
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

  const handleRenameReport = (name: string) => {
    if (reportToRename) {
      renameMutation.mutate({ id: reportToRename.id, name });
    }
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
      <ReportRenameModal
        opened={renameModalOpened}
        onClose={() => {
          setRenameModalOpened(false);
          setReportToRename(null);
        }}
        onSubmit={handleRenameReport}
        currentName={reportToRename?.name || ''}
        isLoading={renameMutation.isPending}
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
      onRowClick={(id) => navigate(`/${countryId}/report/${id}`)}
      />
    </>
  );
}

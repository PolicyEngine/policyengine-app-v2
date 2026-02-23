import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack } from '@/components/ui';
import { useDisclosure } from '@/hooks/useDisclosure';
import {
  BulletsValue,
  ColumnConfig,
  IngredientRecord,
  LinkValue,
  TextValue,
} from '@/components/columns';
import { RenameIngredientModal } from '@/components/common/RenameIngredientModal';
import IngredientReadView from '@/components/IngredientReadView';
import { MultiSimOutputTypeCell } from '@/components/report/MultiSimReportOutputTypeCell';
import { ReportOutputTypeCell } from '@/components/report/ReportOutputTypeCell';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUpdateReportAssociation } from '@/hooks/useUserReportAssociations';
import { useUserReports } from '@/hooks/useUserReports';
import { useCacheMonitor } from '@/utils/cacheMonitor';
import { formatDate } from '@/utils/dateUtils';

export default function ReportsPage() {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserReports(userId);
  const cacheMonitor = useCacheMonitor();
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  // Log cache state when component mounts and when data changes
  useEffect(() => {
    cacheMonitor.getStats();
  }, [data]);

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Rename modal state
  const [renamingReportId, setRenamingReportId] = useState<string | null>(null);
  const [renameOpened, { open: openRename, close: closeRename }] = useDisclosure(false);

  // Rename mutation hook
  const updateAssociation = useUpdateReportAssociation();

  const handleBuildReport = () => {
    const targetPath = `/${countryId}/reports/create`;
    navigate(targetPath);
  };

  const handleSelectionChange = (recordId: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, recordId] : prev.filter((id) => id !== recordId)
    );
  };

  const isSelected = (recordId: string) => selectedIds.includes(recordId);

  const handleOpenRename = (userReportId: string) => {
    setRenamingReportId(userReportId);
    openRename();
  };

  const handleCloseRename = () => {
    closeRename();
    setRenamingReportId(null);
  };

  const handleRename = async (newLabel: string) => {
    if (!renamingReportId) {
      return;
    }

    try {
      await updateAssociation.mutateAsync({
        userReportId: renamingReportId,
        updates: { label: newLabel },
      });
      handleCloseRename();
    } catch (error) {
      console.error('[ReportsPage] Failed to rename report:', error);
    }
  };

  // Find the report being renamed for current label
  const renamingReport = data?.find((item) => item.userReport.id === renamingReportId);
  const currentLabel =
    renamingReport?.userReport.label || `Report #${renamingReport?.userReport.reportId}`;

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
      key: 'year',
      header: 'Year',
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
      type: 'menu',
      actions: [{ label: 'Rename', action: 'rename' }],
      onAction: (action: string, recordId: string) => {
        if (action === 'rename') {
          handleOpenRename(recordId);
        }
      },
    },
  ];

  // Transform the data to match the new structure
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
          year: {
            text: item.report?.year || '',
          } as TextValue,
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
            custom: isHouseholdReport ? (
              <MultiSimOutputTypeCell
                simulationIds={simulationIds}
                report={item.report}
                simulations={item.simulations}
              />
            ) : (
              <ReportOutputTypeCell reportId={item.userReport.reportId} report={item.report} />
            ),
          },
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
            text: isHouseholdReport ? 'Household' : 'Society-wide',
          } as TextValue,
        };
      }) || [],
    [data, countryId]
  );

  return (
    <>
      <Stack gap="md">
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
          enableSelection
          isSelected={isSelected}
          onSelectionChange={handleSelectionChange}
        />
      </Stack>

      <RenameIngredientModal
        opened={renameOpened}
        onClose={handleCloseRename}
        currentLabel={currentLabel}
        onRename={handleRename}
        isLoading={updateAssociation.isPending}
        ingredientType="report"
      />
    </>
  );
}

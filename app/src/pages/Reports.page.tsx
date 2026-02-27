import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Loader, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
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
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUserId } from '@/hooks/useUserId';
import { useUpdateReportAssociation } from '@/hooks/useUserReportAssociations';
import { useUserReports } from '@/hooks/useUserReports';
import { reportAssociationKeys } from '@/libs/queryKeys';
import { hasLocalStorageData } from '@/libs/v1Migration';
import { useCacheMonitor } from '@/utils/cacheMonitor';
import { formatDate } from '@/utils/dateUtils';

export default function ReportsPage() {
  const userId = useUserId();
  const { data, isLoading, isError, error } = useUserReports(userId);
  const cacheMonitor = useCacheMonitor();
  const navigate = useNavigate();
  const countryId = useCurrentCountry();
  const queryClient = useQueryClient();

  // Log cache state when component mounts and when data changes
  useEffect(() => {
    cacheMonitor.getStats();
  }, [data]);

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // V1→v2 migration state
  const [showMigration] = useState(() => hasLocalStorageData());
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<boolean | null>(null);

  const handleMigrate = useCallback(async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const { migrateV1AssociationsToV2 } = await import('@/libs/v1Migration');
      const success = await migrateV1AssociationsToV2(userId);
      setMigrationResult(success);
    } catch (err) {
      console.error('[ReportsPage] Migration failed:', err);
      setMigrationResult(false);
    } finally {
      setIsMigrating(false);
      queryClient.invalidateQueries({ queryKey: reportAssociationKeys.all });
    }
  }, [userId, queryClient]);

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
        userId,
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
        {showMigration && migrationResult === null && (
          <Alert variant="light" color="blue" title="Local data available for sync">
            <Text size="sm">
              You have report and simulation data saved in local storage. Sync it to the v2 API to
              keep it accessible.
            </Text>
            {isMigrating ? (
              <Loader size="sm" mt="sm" />
            ) : (
              <Button onClick={handleMigrate} mt="sm" size="sm">
                Sync my data to v2 API
              </Button>
            )}
          </Alert>
        )}
        {migrationResult !== null && (
          <Alert
            variant="light"
            color={migrationResult ? 'green' : 'red'}
            title={migrationResult ? 'Sync complete' : 'Sync had errors'}
          >
            <Text size="sm">
              {migrationResult
                ? 'All local data has been synced to the v2 API.'
                : 'Some items failed to sync. Check the console for details.'}
            </Text>
          </Alert>
        )}
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

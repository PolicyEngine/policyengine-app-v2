import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Progress, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { colors, spacing, typography } from '@/designTokens';
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
import {
  detectV1Reports,
  migrateAllV1Reports,
  type MigrationProgress,
  type MigrationRunResult,
  type V1ReportInfo,
} from '@/libs/migration';
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

  // V1 migration state
  const [v1Reports, setV1Reports] = useState<V1ReportInfo[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationRunResult | null>(null);

  // Detect v1 reports on load
  useEffect(() => {
    const found = detectV1Reports(userId);
    setV1Reports(found);
  }, [userId]);

  const handleMigrate = useCallback(async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const result = await migrateAllV1Reports(userId, (progress) => {
        setMigrationProgress(progress);
      });
      setMigrationResult(result);
      setV1Reports([]);
      queryClient.invalidateQueries();
    } catch (err) {
      console.error('[ReportsPage] Migration failed:', err);
    } finally {
      setIsMigrating(false);
      setMigrationProgress(null);
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
        {v1Reports.length > 0 && !migrationResult && (
          <Box
            p={spacing.xl}
            style={{
              backgroundColor: colors.gray[200],
              borderRadius: spacing.radius.lg,
            }}
          >
            <Text
              fw={typography.fontWeight.semibold}
              fz={typography.fontSize.base}
              c={colors.text.primary}
              mb={spacing.xs}
            >
              Some reports need migration
            </Text>
            <Text fz={typography.fontSize.sm} c={colors.text.secondary}>
              We found {v1Reports.length} report(s) that use an older version of our API. These
              reports will not work correctly until migrated to the new version.
            </Text>
            {isMigrating && migrationProgress ? (
              <Stack gap="xs" mt="sm">
                <Text size="sm">
                  Migrating {migrationProgress.current} of {migrationProgress.total}
                  {migrationProgress.currentLabel ? `: ${migrationProgress.currentLabel}` : ''}
                </Text>
                <Progress
                  value={(migrationProgress.current / migrationProgress.total) * 100}
                  size="sm"
                  animated
                />
              </Stack>
            ) : (
              <Button mt="sm" size="sm" onClick={handleMigrate} loading={isMigrating}>
                Migrate reports
              </Button>
            )}
          </Box>
        )}

        {migrationResult && (
          <Alert
            color={
              migrationResult.failed.length > 0
                ? 'orange'
                : [...migrationResult.succeeded, ...migrationResult.failed].some(
                      (r) => r.warnings?.length,
                    )
                  ? 'yellow'
                  : 'teal'
            }
            title="Migration complete"
          >
            <Text size="sm">
              {migrationResult.succeeded.length} of {migrationResult.total} report(s) migrated
              successfully.
              {migrationResult.failed.length > 0 &&
                ` ${migrationResult.failed.length} report(s) failed to migrate.`}
            </Text>
            {migrationResult.failed.length > 0 && (
              <Stack gap="xs" mt="sm">
                <Text size="sm" fw={600}>
                  Failed migrations:
                </Text>
                {migrationResult.failed.map((f) => (
                  <Stack key={f.v1UserAssociationId} gap={2}>
                    <Text size="xs" c="dimmed">
                      Report: {f.label || `#${f.v1ReportId}`}
                    </Text>
                    {f.errors.map((e, i) => (
                      <Text key={i} size="xs" c="red.7">
                        &bull; {e.stage}: {e.message}
                      </Text>
                    ))}
                  </Stack>
                ))}
              </Stack>
            )}
            {[...migrationResult.succeeded, ...migrationResult.failed].some(
              (r) => r.warnings?.length,
            ) && (
              <Stack gap="xs" mt="sm">
                <Text size="sm" fw={600}>
                  Warnings:
                </Text>
                {[...migrationResult.succeeded, ...migrationResult.failed]
                  .filter((r) => r.warnings?.length)
                  .map((r) => (
                    <Stack key={r.v1UserAssociationId} gap={2}>
                      <Text size="xs" c="dimmed">
                        Report: {r.label || `#${r.v1ReportId}`}
                      </Text>
                      {r.warnings!.map((w, i) => (
                        <Text key={i} size="xs" c="orange.7">
                          &bull; {w}
                        </Text>
                      ))}
                    </Stack>
                  ))}
              </Stack>
            )}
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

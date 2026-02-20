import { useEffect, useMemo, useState } from 'react';
import { IconCursorText, IconPencil, IconSearch } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Stack } from '@mantine/core';
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
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUpdateReportAssociation } from '@/hooks/useUserReportAssociations';
import { useUserReports } from '@/hooks/useUserReports';
import { RootState } from '@/store';
import { useCacheMonitor } from '@/utils/cacheMonitor';
import { formatDate } from '@/utils/dateUtils';
import { CURRENT_LAW_LABEL } from './reportBuilder/currentLaw';

export default function ReportsPage() {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserReports(userId);
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  const cacheMonitor = useCacheMonitor();
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  // Log cache state when component mounts and when data changes
  useEffect(() => {
    cacheMonitor.getStats();
  }, [data]);

  const [searchValue, setSearchValue] = useState('');

  // Rename modal state
  const [renamingReportId, setRenamingReportId] = useState<string | null>(null);
  const [renameOpened, { open: openRename, close: closeRename }] = useDisclosure(false);

  // Rename mutation hook
  const updateAssociation = useUpdateReportAssociation();

  const handleBuildReport = () => {
    const targetPath = `/${countryId}/reports/create`;
    navigate(targetPath);
  };

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
      key: 'policies',
      header: 'Policies',
      type: 'bullets',
      items: [
        {
          textKey: 'text',
          badgeKey: 'badge',
        },
      ],
    },
    {
      key: 'population',
      header: 'Population',
      type: 'text',
    },
    {
      key: 'actions',
      header: '',
      type: 'actions',
      actions: [
        { action: 'rename', tooltip: 'Rename', icon: <IconCursorText size={16} /> },
        { action: 'view', tooltip: 'View report', icon: <IconSearch size={16} /> },
        { action: 'edit', tooltip: 'Edit report', icon: <IconPencil size={16} /> },
      ],
      onAction: (action: string, recordId: string) => {
        if (action === 'rename') {
          handleOpenRename(recordId);
        }
        if (action === 'view') {
          navigate(`/${countryId}/report-builder/${recordId}`);
        }
        if (action === 'edit') {
          navigate(`/${countryId}/report-builder/${recordId}`, { state: { edit: true } });
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

        // Build policy labels from simulations
        const policyItems = item.simulations?.map((sim) => {
          if (sim.policyId === currentLawId?.toString()) {
            return { text: CURRENT_LAW_LABEL };
          }
          const userPolicy = item.userPolicies?.find((up) => up.policyId === sim.policyId);
          if (userPolicy?.label) {
            return { text: userPolicy.label };
          }
          const policy = item.policies?.find((p) => p.id === sim.policyId);
          return { text: policy?.label || `Policy #${sim.policyId}` };
        }) || [{ text: 'No policies' }];

        // Build population label (shared across simulations)
        const firstSim = item.simulations?.[0];
        let populationLabel = '';
        if (firstSim?.populationType === 'household') {
          const userHousehold = item.userHouseholds?.find(
            (uh) => uh.householdId === firstSim.populationId
          );
          populationLabel = userHousehold?.label || 'Household';
        } else if (firstSim?.populationId) {
          const geo = item.geographies?.find(
            (g) => g.id === firstSim.populationId || g.geographyId === firstSim.populationId
          );
          populationLabel = geo?.name || firstSim.populationId;
        }

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
          policies: {
            items: policyItems,
          } as BulletsValue,
          population: {
            text: populationLabel,
          } as TextValue,
        };
      }) || [],
    [data, countryId, currentLawId]
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

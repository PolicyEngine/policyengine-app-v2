import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import {
  ColumnConfig,
  IngredientRecord,
  TextValue,
} from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import ReportRenameModal from '@/components/report/ReportRenameModal';
import { MOCK_USER_ID } from '@/constants';
import { SimulationCreationFlow } from '@/flows/simulationCreationFlow';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';
import { useSimulationsWithPolicies } from '@/hooks/useSimulations';
import { userSimulationsAPI } from '@/api/v2/userSimulations';
import { setFlow } from '@/reducers/flowReducer';

export default function SimulationsPage() {
  const navigate = useNavigate();
  const { countryId } = useParams<{ countryId: string }>();
  const queryClient = useQueryClient();
  const { data: simulations, isLoading, error } = useSimulationsWithPolicies();
  const dispatch = useDispatch();
  const isError = !!error;

  const [searchValue, setSearchValue] = useState('');
  const { selectedIds, handleSelectionChange, isSelected } = useIngredientSelection();
  const [renameModalOpened, setRenameModalOpened] = useState(false);
  const [simulationToRename, setSimulationToRename] = useState<{ id: string; name: string } | null>(null);

  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';

  // Fetch user simulation associations
  const { data: userSimulations = [] } = useQuery({
    queryKey: ['userSimulations', userId],
    queryFn: () => userSimulationsAPI.list(userId),
  });

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({ simulationId, name }: { simulationId: string; name: string }) => {
      const existing = userSimulations.find(us => us.simulation_id === simulationId);

      if (existing) {
        return userSimulationsAPI.update(existing.id, { custom_name: name });
      } else {
        return userSimulationsAPI.create({
          user_id: userId,
          simulation_id: simulationId,
          custom_name: name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSimulations', userId] });
      setRenameModalOpened(false);
      setSimulationToRename(null);
    },
  });

  const handleBuildSimulation = () => {
    dispatch(setFlow(SimulationCreationFlow));
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  const handleRenameSimulation = (name: string) => {
    if (simulationToRename) {
      renameMutation.mutate({ simulationId: simulationToRename.id, name });
    }
  };

  const { handleMenuAction, getDefaultActions } = useIngredientActions({
    ingredient: 'simulation',
    onRename: (id: string) => {
      const simulation = simulations?.find(s => s.id === id);
      if (simulation) {
        const userSim = userSimulations.find(us => us.simulation_id === id);
        setSimulationToRename({
          id: simulation.id,
          name: userSim?.custom_name || simulation.name || simulation.id,
        });
        setRenameModalOpened(true);
      }
    },
    onView: (id: string) => {
      navigate(`/simulation/${id}`);
    },
  });

  // Define column configurations for simulations
  const simulationColumns: ColumnConfig[] = [
    {
      key: 'simulationId',
      header: 'Simulation ID',
      type: 'text',
    },
    {
      key: 'description',
      header: 'Description',
      type: 'text',
    },
    {
      key: 'dateCreated',
      header: 'Date created',
      type: 'text',
    },
    {
      key: 'status',
      header: 'Status',
      type: 'text',
    },
    {
      key: 'dataset',
      header: 'Dataset',
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

  // Transform the data to match the new structure
  const transformedData: IngredientRecord[] =
    simulations?.map((sim) => {
      const userSim = userSimulations.find(us => us.simulation_id === sim.id);
      const displayName = userSim?.custom_name || sim.name || sim.id;

      return {
        id: sim.id,
        simulationId: {
          text: sim.id.slice(0, 8), // Short UUID display
        } as TextValue,
        description: {
          text: displayName,
        } as TextValue,
        dateCreated: {
          text: moment(sim.created_at).fromNow(),
        } as TextValue,
        status: {
          text: sim.has_result ? 'Ready' : 'Not ready',
        } as TextValue,
        dataset: {
          text: sim.dataset_id ? `Dataset ${sim.dataset_id}` : 'Default dataset',
        } as TextValue,
      };
    }) || [];

  return (
    <>
      <ReportRenameModal
        opened={renameModalOpened}
        onClose={() => {
          setRenameModalOpened(false);
          setSimulationToRename(null);
        }}
        onSubmit={handleRenameSimulation}
        currentName={simulationToRename?.name || ''}
        isLoading={renameMutation.isPending}
      />
      <IngredientReadView
        ingredient="simulation"
        title="Simulations"
        subtitle="Build and save tax policy scenarios for quick access when creating impact reports. Pre-configured simulations accelerate report generation by up to X%"
        onBuild={handleBuildSimulation}
        isLoading={isLoading}
        isError={isError}
        error={error}
        data={transformedData}
        columns={simulationColumns}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onMoreFilters={handleMoreFilters}
        enableSelection
        isSelected={isSelected}
        onSelectionChange={handleSelectionChange}
        onRowClick={(id) => navigate(`/${countryId}/simulation/${id}`)}
      />
    </>
  );
}

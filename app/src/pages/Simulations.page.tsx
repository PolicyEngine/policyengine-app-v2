import { useState } from 'react';
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
import CreateSimulationModal from '@/components/simulation/CreateSimulationModal';
import { MOCK_USER_ID } from '@/constants';
import { useIngredientActions } from '@/hooks/useIngredientActions';
import { useIngredientSelection } from '@/hooks/useIngredientSelection';
import { useSimulationsWithPolicies } from '@/hooks/useSimulations';
import { userSimulationsAPI } from '@/api/v2/userSimulations';
import { usersAPI } from '@/api/v2/users';
import { simulationsAPI } from '@/api/v2/simulations';
import { notifications } from '@mantine/notifications';

export default function SimulationsPage() {
  const navigate = useNavigate();
  
  const queryClient = useQueryClient();
  const { data: simulations, isLoading, error } = useSimulationsWithPolicies();
  const isError = !!error;

  const [searchValue, setSearchValue] = useState('');
  const { selectedIds, handleSelectionChange, isSelected } = useIngredientSelection();

  const handleDeleteSelected = () => {
    selectedIds.forEach(id => deleteMutation.mutate(id));
  };
  const [renameModalOpened, setRenameModalOpened] = useState(false);
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [simulationToRename, setSimulationToRename] = useState<{ id: string; name: string } | null>(null);

  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';

  // Fetch user simulation associations
  const { data: userSimulations = [] } = useQuery({
    queryKey: ['userSimulations', userId],
    queryFn: () => userSimulationsAPI.list(userId),
  });

  // Fetch all users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.listUsers({ limit: 1000 }),
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (simulationId: string) => {
      return simulationsAPI.delete(simulationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      notifications.show({
        title: 'Simulation deleted',
        message: 'The simulation has been deleted successfully',
        color: 'green',
      });
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete simulation',
        color: 'red',
      });
    },
  });

  const handleBuildSimulation = () => {
    setCreateModalOpened(true);
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
      key: 'createdBy',
      header: 'Created by',
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
      key: 'error',
      header: 'Error',
      type: 'text',
    },
    {
      key: 'dataset',
      header: 'Dataset',
      type: 'text',
    },
  ];

  // Transform the data to match the new structure
  const transformedData: IngredientRecord[] =
    simulations?.map((sim) => {
      const userSim = userSimulations.find(us => us.simulation_id === sim.id);
      const displayName = userSim?.custom_name || sim.name || sim.id;

      const creator = userSim ? users.find(u => u.id === userSim.user_id) : null;
      const creatorName = creator ? usersAPI.getDisplayName(creator) : '';

      return {
        id: sim.id,
        simulationId: {
          text: sim.id.slice(0, 8), // Short UUID display
        } as TextValue,
        description: {
          text: displayName,
        } as TextValue,
        createdBy: {
          text: creatorName ? `by ${creatorName}` : '',
        } as TextValue,
        dateCreated: {
          text: moment(sim.created_at).fromNow(),
        } as TextValue,
        status: {
          text: sim.error ? 'Failed' : (sim.has_result ? 'Ready' : 'Pending'),
        } as TextValue,
        error: {
          text: sim.error ? sim.error.slice(0, 100) + (sim.error.length > 100 ? '...' : '') : '',
        } as TextValue,
        dataset: {
          text: sim.dataset_id ? `Dataset ${sim.dataset_id}` : 'Default dataset',
        } as TextValue,
      };
    }) || [];

  return (
    <>
      <CreateSimulationModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
      />
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
        onDelete={handleDeleteSelected}
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
        selectedCount={selectedIds.length}
        onRowClick={(id) => navigate(`/simulation/${id}`)}
      />
    </>
  );
}

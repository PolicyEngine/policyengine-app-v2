import { Button } from '@mantine/core';
import { IconBookmark, IconBookmarkFilled } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showNotification } from '@mantine/notifications';

interface AddToLibraryButtonProps {
  resourceType: 'policy' | 'simulation' | 'report' | 'dataset' | 'dynamic';
  resourceId: string;
  userId: string;
  isInLibrary: boolean;
  userResourceId?: string;
  variant?: 'filled' | 'light' | 'outline' | 'subtle';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function AddToLibraryButton({
  resourceType,
  resourceId,
  userId,
  isInLibrary,
  userResourceId,
  variant = 'light',
  size = 'sm',
}: AddToLibraryButtonProps) {
  const queryClient = useQueryClient();

  const getAPI = () => {
    switch (resourceType) {
      case 'policy':
        return import('@/api/v2/userPolicies').then(m => m.userPoliciesAPI);
      case 'simulation':
        return import('@/api/v2/userSimulations').then(m => m.userSimulationsAPI);
      case 'report':
        return import('@/api/v2/userReports').then(m => m.userReportsAPI);
      case 'dataset':
        return import('@/api/v2/userDatasets').then(m => m.userDatasetsAPI);
      case 'dynamic':
        return import('@/api/v2/userDynamics').then(m => m.userDynamicsAPI);
    }
  };

  const getResourceIdKey = () => {
    return `${resourceType}_id`;
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const api = await getAPI();
      if (resourceType === 'dataset') {
        // userDatasetsAPI has different signature
        return (api as any).createUserDataset(userId, {
          dataset_id: resourceId,
        });
      }
      return api.create(userId, {
        [getResourceIdKey()]: resourceId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`user${resourceType.charAt(0).toUpperCase()}${resourceType.slice(1)}s`, userId] });
      showNotification({
        title: 'Added to library',
        message: `${resourceType.charAt(0).toUpperCase()}${resourceType.slice(1)} added to your library`,
        color: 'green',
      });
    },
    onError: () => {
      showNotification({
        title: 'Error',
        message: `Failed to add ${resourceType} to library`,
        color: 'red',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!userResourceId) throw new Error('No user resource ID');
      const api = await getAPI();
      if (resourceType === 'dataset') {
        // userDatasetsAPI has different signature
        return (api as any).deleteUserDataset(userId, resourceId);
      }
      return api.delete(userId, resourceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`user${resourceType.charAt(0).toUpperCase()}${resourceType.slice(1)}s`, userId] });
      showNotification({
        title: 'Removed from library',
        message: `${resourceType.charAt(0).toUpperCase()}${resourceType.slice(1)} removed from your library`,
        color: 'blue',
      });
    },
    onError: () => {
      showNotification({
        title: 'Error',
        message: `Failed to remove ${resourceType} from library`,
        color: 'red',
      });
    },
  });

  const handleClick = () => {
    if (isInLibrary) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      leftSection={isInLibrary ? <IconBookmarkFilled size={16} /> : <IconBookmark size={16} />}
      onClick={handleClick}
      loading={addMutation.isPending || removeMutation.isPending}
    >
      {isInLibrary ? 'In library' : 'Add to library'}
    </Button>
  );
}

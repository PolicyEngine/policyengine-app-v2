/*
//------------------------------------------------------------------
// TO ADD LATER - MOCK FUNCTIONALITY
//------------------------------------------------------------------

export const useAuth = () => {
  // This would typically come from your auth context/store
  // Replace with your actual auth implementation
  const user: User | null = null; // Replace with actual user state
  const isLoggedIn = !!user;
  
  return { user, isLoggedIn };
};

//------------------------------------------------------------------
// TO REFACTOR OFF OF
//------------------------------------------------------------------

// components/CreatePolicyForm.tsx
import React from 'react';
import { Button, TextInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCreatePolicy } from '../hooks/useCreatePolicy';
import { CreatePolicyRequest } from '../types/policy';

export const CreatePolicyForm: React.FC = () => {
  const { createPolicy, isCreating, error } = useCreatePolicy();

  const form = useForm<CreatePolicyRequest>({
    initialValues: {
      name: '',
      // Add other initial values
    },
    validate: {
      name: (value) => (value.length < 1 ? 'Policy name is required' : null),
    },
  });

  const handleSubmit = async (values: CreatePolicyRequest) => {
    try {
      await createPolicy(values);
      form.reset();
      // Optionally show success notification
    } catch (error) {
      // Error is already handled in the hook
      console.error('Form submission failed:', error);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Policy Name"
          placeholder="Enter policy name"
          {...form.getInputProps('name')}
        />
        
        <Button 
          type="submit" 
          loading={isCreating}
          disabled={isCreating}
        >
          Create Policy
        </Button>
        
        {error && (
          <div style={{ color: 'red' }}>
            Error: {error.message}
          </div>
        )}
      </Stack>
    </form>
  );
};

//------------------------------------------------------------------
// UNCLEAR YET
//------------------------------------------------------------------

export interface CreatePolicyRequest {
  name: string;
  // Add other policy creation fields
}

export interface CreatePolicyResponse {
  policy: Policy;
}

// hooks/useSyncSessionAssociations.ts (Optional utility for login sync)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SessionStorageAssociationRepository, ApiAssociationRepository } from '../repositories/PolicyAssociationRepository';
import { associationKeys } from '../services/queryKeys';
import { useAuth } from './useAuth';

export const useSyncSessionAssociations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const sessionRepository = new SessionStorageAssociationRepository();
  const apiRepository = new ApiAssociationRepository();

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('User must be logged in to sync associations');
      }

      const sessionAssociations = sessionRepository.getAllAssociations();
      
      // Filter out anonymous associations and update them with real user ID
      const associationsToSync = sessionAssociations
        .filter(a => a.userId === 'anonymous')
        .map(a => ({ ...a, userId: user.id }));

      // Sync each association to the API
      for (const association of associationsToSync) {
        try {
          await apiRepository.create({
            userId: association.userId,
            policyId: association.policyId,
          });
        } catch (error) {
          // Log but don't fail the entire sync for individual errors
          console.warn(`Failed to sync association for policy ${association.policyId}:`, error);
        }
      }
      
      // Clear session storage after sync attempt
      sessionRepository.clearAllAssociations();
      
      return associationsToSync.length;
    },
    onSuccess: (syncedCount) => {
      if (user && syncedCount > 0) {
        // Invalidate user associations to refetch from API
        queryClient.invalidateQueries({ queryKey: associationKeys.byUser(user.id) });
      }
    },
  });

  return {
    syncAssociations: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
  };
};

//------------------------------------------------------------------
// TO MODIFY/CONFIRM
//------------------------------------------------------------------

// types/policy.ts
export interface Policy {
  id: string;
  name: string;
  // Add other policy fields as needed
}


//------------------------------------------------------------------
// NO CHANGE IN PLACE OF EXISTING CODE
//------------------------------------------------------------------



const createPolicyApi = async (data: CreatePolicyRequest): Promise<CreatePolicyResponse> => {
  const response = await fetch('/api/policies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create policy');
  }

  return response.json();
};





//------------------------------------------------------------------
// ADDED
//------------------------------------------------------------------


export interface UserPolicyAssociation {
  userId: string; // TODO: Verify type
  policyId: string; // TODO: Verify type
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  // Add other user fields
}

export const associationKeys = {
  all: ['associations'] as const,
  byUser: (userId: string) => [...associationKeys.all, 'user', userId] as const,
  byPolicy: (policyId: string) => [...associationKeys.all, 'policy', policyId] as const,
  specific: (userId: string, policyId: string) => 
    [...associationKeys.all, 'specific', userId, policyId] as const,
};

export const policyKeys = {
  all: ['policies'] as const,
};

export const queryConfig = {
  api: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
  },
  sessionStorage: {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 0,
  },
} as const;

// repositories/PolicyAssociationRepository.ts
export interface PolicyAssociationRepository {
  create(association: Omit<UserPolicyAssociation, 'createdAt'>): Promise<UserPolicyAssociation>;
  findByUser(userId: string): Promise<UserPolicyAssociation[]>;
  findByPolicy(policyId: string): Promise<UserPolicyAssociation[]>;
  findById(userId: string, policyId: string): Promise<UserPolicyAssociation | null>;
  update(userId: string, policyId: string, updates: Partial<UserPolicyAssociation>): Promise<UserPolicyAssociation>;
  delete(userId: string, policyId: string): Promise<void>;
}

export class ApiAssociationRepository implements PolicyAssociationRepository {
  async create(association: Omit<UserPolicyAssociation, 'createdAt'>): Promise<UserPolicyAssociation> {
    const response = await fetch('/api/user-policy-associations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(association),
    });

    if (!response.ok) {
      throw new Error('Failed to create policy association');
    }

    return response.json();
  }

  async findByUser(userId: string): Promise<UserPolicyAssociation[]> {
    const response = await fetch(`/api/user-policy-associations/user/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    return response.json();
  }

  async findByPolicy(policyId: string): Promise<UserPolicyAssociation[]> {
    const response = await fetch(`/api/user-policy-associations/policy/${policyId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch policy associations');
    }

    return response.json();
  }

  async findById(userId: string, policyId: string): Promise<UserPolicyAssociation | null> {
    const response = await fetch(`/api/user-policy-associations/${userId}/${policyId}`);
    
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch association');
    }

    return response.json();
  }

  async update(userId: string, policyId: string, updates: Partial<UserPolicyAssociation>): Promise<UserPolicyAssociation> {
    const response = await fetch(`/api/user-policy-associations/${userId}/${policyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update association');
    }

    return response.json();
  }

  async delete(userId: string, policyId: string): Promise<void> {
    const response = await fetch(`/api/user-policy-associations/${userId}/${policyId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete association');
    }
  }
}

export class SessionStorageAssociationRepository implements PolicyAssociationRepository {
  private readonly STORAGE_KEY = 'user-policy-associations';

  async create(association: Omit<UserPolicyAssociation, 'createdAt'>): Promise<UserPolicyAssociation> {
    const newAssociation: UserPolicyAssociation = {
      ...association,
      createdAt: new Date().toISOString(),
    };

    const associations = this.getStoredAssociations();
    
    // Check for duplicates
    const exists = associations.some(
      a => a.userId === association.userId && a.policyId === association.policyId
    );
    
    if (exists) {
      throw new Error('Association already exists');
    }

    const updatedAssociations = [...associations, newAssociation];
    this.setStoredAssociations(updatedAssociations);
    
    return newAssociation;
  }

  async findByUser(userId: string): Promise<UserPolicyAssociation[]> {
    const associations = this.getStoredAssociations();
    return associations.filter(a => a.userId === userId);
  }

  async findByPolicy(policyId: string): Promise<UserPolicyAssociation[]> {
    const associations = this.getStoredAssociations();
    return associations.filter(a => a.policyId === policyId);
  }

  async findById(userId: string, policyId: string): Promise<UserPolicyAssociation | null> {
    const associations = this.getStoredAssociations();
    return associations.find(a => a.userId === userId && a.policyId === policyId) || null;
  }

  async update(userId: string, policyId: string, updates: Partial<UserPolicyAssociation>): Promise<UserPolicyAssociation> {
    const associations = this.getStoredAssociations();
    const index = associations.findIndex(a => a.userId === userId && a.policyId === policyId);
    
    if (index === -1) {
      throw new Error('Association not found');
    }

    const updatedAssociation = { ...associations[index], ...updates };
    associations[index] = updatedAssociation;
    
    this.setStoredAssociations(associations);
    return updatedAssociation;
  }

  async delete(userId: string, policyId: string): Promise<void> {
    const associations = this.getStoredAssociations();
    const filtered = associations.filter(a => !(a.userId === userId && a.policyId === policyId));
    
    if (filtered.length === associations.length) {
      throw new Error('Association not found');
    }

    this.setStoredAssociations(filtered);
  }

  private getStoredAssociations(): UserPolicyAssociation[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setStoredAssociations(associations: UserPolicyAssociation[]): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(associations));
    } catch (error) {
      throw new Error('Failed to store associations in session storage');
    }
  }

  // Utility for syncing when user logs in
  getAllAssociations(): UserPolicyAssociation[] {
    return this.getStoredAssociations();
  }

  clearAllAssociations(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}

// hooks/useRepository.ts
import { useAuth } from './useAuth';
import { ApiAssociationRepository, SessionStorageAssociationRepository } from '../repositories/PolicyAssociationRepository';

const apiRepository = new ApiAssociationRepository();
const sessionRepository = new SessionStorageAssociationRepository();

export const useRepository = () => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? apiRepository : sessionRepository;
};

// hooks/useAssociationQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { associationKeys } from '../services/queryKeys';
import { queryConfig } from '../services/queryConfig';
import { useRepository } from './useRepository';
import { useAuth } from './useAuth';
import { UserPolicyAssociation } from '../types/policy';

export const useAssociationsByUser = (userId: string) => {
  const repository = useRepository();
  const { isLoggedIn } = useAuth();
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: associationKeys.byUser(userId),
    queryFn: () => repository.findByUser(userId),
    ...config,
  });
};

export const useAssociationsByPolicy = (policyId: string) => {
  const repository = useRepository();
  const { isLoggedIn } = useAuth();
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: associationKeys.byPolicy(policyId),
    queryFn: () => repository.findByPolicy(policyId),
    ...config,
  });
};

export const useAssociation = (userId: string, policyId: string) => {
  const repository = useRepository();
  const { isLoggedIn } = useAuth();
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: associationKeys.specific(userId, policyId),
    queryFn: () => repository.findById(userId, policyId),
    ...config,
  });
};

export const useCreateAssociation = () => {
  const repository = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (association: Omit<UserPolicyAssociation, 'createdAt'>) => 
      repository.create(association),
    onSuccess: (newAssociation) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: associationKeys.byUser(newAssociation.userId) });
      queryClient.invalidateQueries({ queryKey: associationKeys.byPolicy(newAssociation.policyId) });
      
      // Update specific query cache
      queryClient.setQueryData(
        associationKeys.specific(newAssociation.userId, newAssociation.policyId),
        newAssociation
      );
    },
  });
};

export const useUpdateAssociation = () => {
  const repository = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, policyId, updates }: {
      userId: string;
      policyId: string;
      updates: Partial<UserPolicyAssociation>;
    }) => repository.update(userId, policyId, updates),
    onSuccess: (updatedAssociation) => {
      queryClient.invalidateQueries({ queryKey: associationKeys.byUser(updatedAssociation.userId) });
      queryClient.invalidateQueries({ queryKey: associationKeys.byPolicy(updatedAssociation.policyId) });
      
      queryClient.setQueryData(
        associationKeys.specific(updatedAssociation.userId, updatedAssociation.policyId),
        updatedAssociation
      );
    },
  });
};

export const useDeleteAssociation = () => {
  const repository = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, policyId }: { userId: string; policyId: string }) =>
      repository.delete(userId, policyId),
    onSuccess: (_, { userId, policyId }) => {
      queryClient.invalidateQueries({ queryKey: associationKeys.byUser(userId) });
      queryClient.invalidateQueries({ queryKey: associationKeys.byPolicy(policyId) });
      
      queryClient.setQueryData(
        associationKeys.specific(userId, policyId),
        null
      );
    },
  });
};

export const useCreatePolicy = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const createAssociation = useCreateAssociation();

  const mutation = useMutation({
    mutationFn: createPolicyApi,
    onSuccess: async (data) => {
      try {
        // Invalidate policies query
        await queryClient.invalidateQueries({ queryKey: policyKeys.all });
        
        // Create association with current user (or anonymous for session storage)
        const userId = user?.id || 'anonymous';
        await createAssociation.mutateAsync({
          userId,
          policyId: data.policy.id,
        });
      } catch (error) {
        console.error('Policy created but association failed:', error);
        // Policy was created successfully, but association failed
        // You might want to handle this scenario (e.g., show a warning)
      }
    },
  });

  return {
    createPolicy: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
};
*/
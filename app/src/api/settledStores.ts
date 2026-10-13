import type { FlagshipReportStore } from '@/api/flagshipReportStore';
import type { UserHouseholdStore } from '@/api/householdAssociation';
import type { UserPolicyStore } from '@/api/policyAssociation';
import type { ReformStore } from '@/api/reformStore';
import type { UserReportStore } from '@/api/reportAssociation';
import type { UserSimulationStore } from '@/api/simulationAssociation';

/**
 * Saved-work stores that wait for the sign-in session to be restored.
 *
 * Each takes a resolver (see useAssociationBackendResolver) and forwards
 * every call to the store for how the session settled. Until then which
 * store applies is unknown, so nothing is written: a signed-in user's save
 * never lands in this browser, and a signed-out visitor's waits only for
 * the restore.
 */

export function deferredPolicyStore(resolve: () => Promise<UserPolicyStore>): UserPolicyStore {
  return {
    create: async (policy) => (await resolve()).create(policy),
    findByUser: async (userId, countryId) => (await resolve()).findByUser(userId, countryId),
    findById: async (userId, policyId) => (await resolve()).findById(userId, policyId),
    update: async (userPolicyId, updates) => (await resolve()).update(userPolicyId, updates),
    delete: async (userPolicyId) => (await resolve()).delete(userPolicyId),
  };
}

export function deferredHouseholdStore(
  resolve: () => Promise<UserHouseholdStore>
): UserHouseholdStore {
  return {
    create: async (association) => (await resolve()).create(association),
    findByUser: async (userId, countryId) => (await resolve()).findByUser(userId, countryId),
    findById: async (userId, householdId) => (await resolve()).findById(userId, householdId),
    update: async (userHouseholdId, updates) => (await resolve()).update(userHouseholdId, updates),
    delete: async (userHouseholdId) => (await resolve()).delete(userHouseholdId),
  };
}

export function deferredSimulationStore(
  resolve: () => Promise<UserSimulationStore>
): UserSimulationStore {
  return {
    create: async (simulation) => (await resolve()).create(simulation),
    findByUser: async (userId, countryId) => (await resolve()).findByUser(userId, countryId),
    findById: async (userId, simulationId) => (await resolve()).findById(userId, simulationId),
    update: async (userSimulationId, updates) =>
      (await resolve()).update(userSimulationId, updates),
    delete: async (userSimulationId) => (await resolve()).delete(userSimulationId),
  };
}

/**
 * `createWithId` saves under the caller's ID where the settled store keeps
 * caller IDs (localStorage) and lets the account assign one otherwise.
 */
export function deferredReportStore(resolve: () => Promise<UserReportStore>): UserReportStore {
  return {
    create: async (report) => (await resolve()).create(report),
    createWithId: async (report) => {
      const store = await resolve();
      if (store.createWithId) {
        return store.createWithId(report);
      }
      const { id: _id, ...fields } = report;
      return store.create(fields);
    },
    findByUser: async (userId, countryId) => (await resolve()).findByUser(userId, countryId),
    findById: async (userId, reportId) => (await resolve()).findById(userId, reportId),
    findByUserReportId: async (userReportId) => (await resolve()).findByUserReportId(userReportId),
    update: async (userReportId, updates) => (await resolve()).update(userReportId, updates),
    delete: async (userReportId) => (await resolve()).delete(userReportId),
  };
}

export function deferredReformStore(resolve: () => Promise<ReformStore>): ReformStore {
  return {
    create: async (reform) => (await resolve()).create(reform),
    findByUser: async (userId, countryId) => (await resolve()).findByUser(userId, countryId),
    findById: async (reformId) => (await resolve()).findById(reformId),
    update: async (reformId, updates) => (await resolve()).update(reformId, updates),
    delete: async (reformId) => (await resolve()).delete(reformId),
  };
}

export function deferredFlagshipReportStore(
  resolve: () => Promise<FlagshipReportStore>
): FlagshipReportStore {
  return {
    create: async (report) => (await resolve()).create(report),
    findByUser: async (userId, countryId) => (await resolve()).findByUser(userId, countryId),
    findById: async (id) => (await resolve()).findById(id),
    findByApiReportId: async (userId, apiReportId) =>
      (await resolve()).findByApiReportId(userId, apiReportId),
    saveValidation: async (id, snapshot) => (await resolve()).saveValidation(id, snapshot),
  };
}

import { describe, expect, test } from 'vitest';
import { UserHouseholdPopulation } from '@/models/UserHouseholdPopulation';
import { UserPolicy } from '@/models/UserPolicy';
import { UserReport } from '@/models/UserReport';
import { UserSimulation } from '@/models/UserSimulation';

const TEST_ID = 'assoc-001';
const TEST_USER_ID = 'user-123';
const TEST_ENTITY_ID = 'entity-456';
const TEST_COUNTRY_ID = 'us' as const;
const TEST_CREATED_AT = '2026-01-15T12:00:00Z';

describe('UserPolicy', () => {
  const buildPolicy = (overrides?: Partial<Parameters<typeof UserPolicy>[0]>) =>
    new UserPolicy({
      id: TEST_ID,
      userId: TEST_USER_ID,
      policyId: TEST_ENTITY_ID,
      countryId: TEST_COUNTRY_ID,
      createdAt: TEST_CREATED_AT,
      label: null,
      ...overrides,
    });

  test('given valid data then constructor sets all readonly fields', () => {
    // Given / When
    const policy = buildPolicy();

    // Then
    expect(policy.id).toBe(TEST_ID);
    expect(policy.userId).toBe(TEST_USER_ID);
    expect(policy.policyId).toBe(TEST_ENTITY_ID);
    expect(policy.countryId).toBe(TEST_COUNTRY_ID);
    expect(policy.createdAt).toBe(TEST_CREATED_AT);
  });

  test('given null label then label getter returns null and setter updates it', () => {
    // Given
    const policy = buildPolicy({ label: null });
    expect(policy.label).toBeNull();

    // When
    policy.label = 'My reform';

    // Then
    expect(policy.label).toBe('My reform');
  });

  test('given a policy then toJSON produces data that reconstructs an equal instance', () => {
    // Given
    const original = buildPolicy({ label: 'Round-trip test' });

    // When
    const json = original.toJSON();
    const restored = new UserPolicy(json);

    // Then
    expect(restored.id).toBe(original.id);
    expect(restored.userId).toBe(original.userId);
    expect(restored.policyId).toBe(original.policyId);
    expect(restored.countryId).toBe(original.countryId);
    expect(restored.createdAt).toBe(original.createdAt);
    expect(restored.label).toBe(original.label);
  });

  test('given two policies with same id then isEqual returns true', () => {
    // Given
    const a = buildPolicy({ label: 'A' });
    const b = buildPolicy({ label: 'B' });

    // When / Then
    expect(a.isEqual(b)).toBe(true);
  });

  test('given two policies with different ids then isEqual returns false', () => {
    // Given
    const a = buildPolicy();
    const b = buildPolicy({ id: 'assoc-999' });

    // When / Then
    expect(a.isEqual(b)).toBe(false);
  });
});

describe('UserSimulation', () => {
  const buildSimulation = (overrides?: Partial<Parameters<typeof UserSimulation>[0]>) =>
    new UserSimulation({
      id: TEST_ID,
      userId: TEST_USER_ID,
      simulationId: TEST_ENTITY_ID,
      countryId: TEST_COUNTRY_ID,
      createdAt: TEST_CREATED_AT,
      label: null,
      ...overrides,
    });

  test('given valid data then constructor sets all readonly fields', () => {
    // Given / When
    const sim = buildSimulation();

    // Then
    expect(sim.id).toBe(TEST_ID);
    expect(sim.userId).toBe(TEST_USER_ID);
    expect(sim.simulationId).toBe(TEST_ENTITY_ID);
    expect(sim.countryId).toBe(TEST_COUNTRY_ID);
    expect(sim.createdAt).toBe(TEST_CREATED_AT);
  });

  test('given null label then label getter returns null and setter updates it', () => {
    // Given
    const sim = buildSimulation({ label: null });
    expect(sim.label).toBeNull();

    // When
    sim.label = 'Baseline sim';

    // Then
    expect(sim.label).toBe('Baseline sim');
  });

  test('given a simulation then toJSON produces data that reconstructs an equal instance', () => {
    // Given
    const original = buildSimulation({ label: 'Round-trip test' });

    // When
    const json = original.toJSON();
    const restored = new UserSimulation(json);

    // Then
    expect(restored.id).toBe(original.id);
    expect(restored.userId).toBe(original.userId);
    expect(restored.simulationId).toBe(original.simulationId);
    expect(restored.countryId).toBe(original.countryId);
    expect(restored.createdAt).toBe(original.createdAt);
    expect(restored.label).toBe(original.label);
  });

  test('given two simulations with same id then isEqual returns true', () => {
    // Given
    const a = buildSimulation({ label: 'A' });
    const b = buildSimulation({ label: 'B' });

    // When / Then
    expect(a.isEqual(b)).toBe(true);
  });

  test('given two simulations with different ids then isEqual returns false', () => {
    // Given
    const a = buildSimulation();
    const b = buildSimulation({ id: 'assoc-999' });

    // When / Then
    expect(a.isEqual(b)).toBe(false);
  });
});

describe('UserReport', () => {
  const buildReport = (overrides?: Partial<Parameters<typeof UserReport>[0]>) =>
    new UserReport({
      id: TEST_ID,
      userId: TEST_USER_ID,
      reportId: TEST_ENTITY_ID,
      countryId: TEST_COUNTRY_ID,
      createdAt: TEST_CREATED_AT,
      label: null,
      ...overrides,
    });

  test('given valid data then constructor sets all readonly fields', () => {
    // Given / When
    const report = buildReport();

    // Then
    expect(report.id).toBe(TEST_ID);
    expect(report.userId).toBe(TEST_USER_ID);
    expect(report.reportId).toBe(TEST_ENTITY_ID);
    expect(report.countryId).toBe(TEST_COUNTRY_ID);
    expect(report.createdAt).toBe(TEST_CREATED_AT);
  });

  test('given null label then label getter returns null and setter updates it', () => {
    // Given
    const report = buildReport({ label: null });
    expect(report.label).toBeNull();

    // When
    report.label = 'Q1 analysis';

    // Then
    expect(report.label).toBe('Q1 analysis');
  });

  test('given a report then toJSON produces data that reconstructs an equal instance', () => {
    // Given
    const original = buildReport({ label: 'Round-trip test' });

    // When
    const json = original.toJSON();
    const restored = new UserReport(json);

    // Then
    expect(restored.id).toBe(original.id);
    expect(restored.userId).toBe(original.userId);
    expect(restored.reportId).toBe(original.reportId);
    expect(restored.countryId).toBe(original.countryId);
    expect(restored.createdAt).toBe(original.createdAt);
    expect(restored.label).toBe(original.label);
  });

  test('given two reports with same id then isEqual returns true', () => {
    // Given
    const a = buildReport({ label: 'A' });
    const b = buildReport({ label: 'B' });

    // When / Then
    expect(a.isEqual(b)).toBe(true);
  });

  test('given two reports with different ids then isEqual returns false', () => {
    // Given
    const a = buildReport();
    const b = buildReport({ id: 'assoc-999' });

    // When / Then
    expect(a.isEqual(b)).toBe(false);
  });
});

describe('UserHouseholdPopulation', () => {
  const buildHouseholdPopulation = (
    overrides?: Partial<Parameters<typeof UserHouseholdPopulation>[0]>
  ) =>
    new UserHouseholdPopulation({
      id: TEST_ID,
      userId: TEST_USER_ID,
      householdId: TEST_ENTITY_ID,
      countryId: TEST_COUNTRY_ID,
      createdAt: TEST_CREATED_AT,
      label: null,
      ...overrides,
    });

  test('given valid data then constructor sets all readonly fields', () => {
    // Given / When
    const hp = buildHouseholdPopulation();

    // Then
    expect(hp.id).toBe(TEST_ID);
    expect(hp.userId).toBe(TEST_USER_ID);
    expect(hp.householdId).toBe(TEST_ENTITY_ID);
    expect(hp.countryId).toBe(TEST_COUNTRY_ID);
    expect(hp.createdAt).toBe(TEST_CREATED_AT);
  });

  test('given null label then label getter returns null and setter updates it', () => {
    // Given
    const hp = buildHouseholdPopulation({ label: null });
    expect(hp.label).toBeNull();

    // When
    hp.label = 'Sample household';

    // Then
    expect(hp.label).toBe('Sample household');
  });

  test('given a household population then toJSON produces data that reconstructs an equal instance', () => {
    // Given
    const original = buildHouseholdPopulation({ label: 'Round-trip test' });

    // When
    const json = original.toJSON();
    const restored = new UserHouseholdPopulation(json);

    // Then
    expect(restored.id).toBe(original.id);
    expect(restored.userId).toBe(original.userId);
    expect(restored.householdId).toBe(original.householdId);
    expect(restored.countryId).toBe(original.countryId);
    expect(restored.createdAt).toBe(original.createdAt);
    expect(restored.label).toBe(original.label);
  });

  test('given two household populations with same id then isEqual returns true', () => {
    // Given
    const a = buildHouseholdPopulation({ label: 'A' });
    const b = buildHouseholdPopulation({ label: 'B' });

    // When / Then
    expect(a.isEqual(b)).toBe(true);
  });

  test('given two household populations with different ids then isEqual returns false', () => {
    // Given
    const a = buildHouseholdPopulation();
    const b = buildHouseholdPopulation({ id: 'assoc-999' });

    // When / Then
    expect(a.isEqual(b)).toBe(false);
  });
});

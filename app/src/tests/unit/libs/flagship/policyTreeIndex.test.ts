import { describe, expect, test } from 'vitest';
import { buildPolicyTreeIndex, folderContents, folderTrail } from '@/libs/flagship/policyTreeIndex';
import { DRAFTABLE, POLICY_TREE } from '@/tests/fixtures/components/flagship/policyTreeFixtures';

describe('buildPolicyTreeIndex', () => {
  test('given a tree then each folder counts the draftable parameters beneath it', () => {
    const index = buildPolicyTreeIndex(POLICY_TREE, DRAFTABLE);

    expect(index.counts.get('gov.irs')).toBe(3);
    expect(index.counts.get('gov.irs.credits.eitc.max')).toBe(2);
    expect(index.counts.get('gov.irs.internal_switch')).toBe(0);
  });

  test('given an agency with nothing draftable then it is not a top-level folder', () => {
    const index = buildPolicyTreeIndex(POLICY_TREE, DRAFTABLE);

    expect(index.roots.map((node) => node.name)).toEqual(['gov.irs']);
  });
});

describe('folderContents', () => {
  test('given a folder then subfolders and draftable parameters split apart', () => {
    const index = buildPolicyTreeIndex(POLICY_TREE, DRAFTABLE);

    const contents = folderContents(index, 'gov.irs.credits');

    expect(contents.folders.map((node) => node.name)).toEqual(['gov.irs.credits.eitc.max']);
    expect(contents.parameters.map((node) => node.name)).toEqual(['gov.irs.credits.ctc_amount']);
  });

  test('given numbered brackets then they sort by number, not as text', () => {
    const index = buildPolicyTreeIndex(POLICY_TREE, DRAFTABLE);

    const contents = folderContents(index, 'gov.irs.credits.eitc.max');

    expect(contents.folders.map((node) => node.label)).toEqual(['Bracket 2', 'Bracket 11']);
  });

  test('given undraftable parameters then they are left out', () => {
    const index = buildPolicyTreeIndex(POLICY_TREE, DRAFTABLE);

    const contents = folderContents(index, 'gov.irs');

    expect(contents.parameters).toEqual([]);
  });
});

describe('folderTrail', () => {
  test('given a nested folder then the trail runs from the top level down to it', () => {
    const index = buildPolicyTreeIndex(POLICY_TREE, DRAFTABLE);

    const trail = folderTrail(index, 'gov.irs.credits.eitc.max');

    expect(trail.map((node) => node.label)).toEqual([
      'Internal Revenue Service (IRS)',
      'Credits',
      'EITC maximum',
    ]);
  });
});

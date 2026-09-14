import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PolicyParameterSelectorView from '@/pathways/report/views/policy/PolicyParameterSelectorView';
import {
  createParameter,
  CURRENT_LAW_METADATA,
  TEST_PARAMETER_NAMES,
} from '@/tests/fixtures/utils/policyCurrentLawMocks';
import type { PolicyStateProps } from '@/types/pathwayState';

const { mockIsMobile } = vi.hoisted(() => ({ mockIsMobile: vi.fn() }));

vi.mock('react-redux', async () => {
  const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
  return {
    ...actual,
    useSelector: (selector: (state: unknown) => unknown) =>
      selector({
        metadata: {
          parameterTree: { name: 'root', label: 'Parameters', index: 0, children: [] },
          parameters: CURRENT_LAW_METADATA,
          loading: false,
          error: null,
        },
      }),
  };
});

vi.mock('@/hooks/useChartDimensions', () => ({
  useIsMobile: () => mockIsMobile(),
}));

vi.mock('@/components/shared/HomeHeader', () => ({ default: () => null }));
vi.mock('@/pathways/report/components/policyParameterSelector/Menu', () => ({
  default: () => null,
}));
vi.mock('@/pathways/report/components/policyParameterSelector/MainEmpty', () => ({
  default: () => null,
}));
vi.mock('@/pathways/report/components/PolicyParameterSelectorMain', () => ({
  default: () => null,
}));

const EMPTY_POLICY: PolicyStateProps = { label: 'No changes', parameters: [] };
const EFFECTIVE_POLICY: PolicyStateProps = {
  label: 'Effective reform',
  parameters: [
    createParameter(TEST_PARAMETER_NAMES.changingAmount, '2025-01-01', '2025-12-31', 150),
  ],
};

describe('PolicyParameterSelectorView', () => {
  beforeEach(() => {
    mockIsMobile.mockReturnValue(false);
  });

  test('given no effective changes on desktop then review is disabled', () => {
    render(
      <PolicyParameterSelectorView
        policy={EMPTY_POLICY}
        onPolicyUpdate={vi.fn()}
        onNext={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /review my policy/i })).toBeDisabled();
  });

  test('given an effective change on desktop then review is enabled', () => {
    render(
      <PolicyParameterSelectorView
        policy={EFFECTIVE_POLICY}
        onPolicyUpdate={vi.fn()}
        onNext={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /review my policy/i })).toBeEnabled();
  });

  test('given no effective changes on mobile then review is disabled', () => {
    mockIsMobile.mockReturnValue(true);
    render(
      <PolicyParameterSelectorView
        policy={EMPTY_POLICY}
        onPolicyUpdate={vi.fn()}
        onNext={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /^review$/i })).toBeDisabled();
  });
});

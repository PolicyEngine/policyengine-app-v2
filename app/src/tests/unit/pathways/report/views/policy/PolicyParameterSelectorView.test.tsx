import { fireEvent, render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PolicyParameterSelectorView from '@/pathways/report/views/policy/PolicyParameterSelectorView';
import {
  createParameter,
  CURRENT_LAW_PARAMETERS,
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
          parameters: CURRENT_LAW_PARAMETERS,
          loading: false,
          error: null,
          currentCountry: 'us',
          currentLawId: 1,
          version: 'test-version',
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

const POLICY_MATCHING_CURRENT_LAW: PolicyStateProps = {
  label: 'Current-law duplicate',
  parameters: [createParameter(TEST_PARAMETER_NAMES.amount, '2026-01-01', '2026-12-31', 100)],
};

const POLICY_WITH_CHANGE: PolicyStateProps = {
  label: 'Changed policy',
  parameters: [createParameter(TEST_PARAMETER_NAMES.amount, '2026-01-01', '2026-12-31', 150)],
};

describe('PolicyParameterSelectorView', () => {
  beforeEach(() => {
    mockIsMobile.mockReturnValue(false);
  });

  test('given a desktop policy matches current law then review is disabled with a reason', () => {
    render(
      <PolicyParameterSelectorView
        policy={POLICY_MATCHING_CURRENT_LAW}
        onPolicyUpdate={vi.fn()}
        onNext={vi.fn()}
      />
    );

    const reviewButton = screen.getByRole('button', { name: /review my policy/i });
    expect(reviewButton).toBeDisabled();
    expect(reviewButton).toHaveAccessibleDescription(/match current law/i);
    expect(screen.getByRole('status')).toHaveTextContent(/match current law/i);
  });

  test('given a policy changes current law then review invokes the next step', () => {
    const onNext = vi.fn();
    render(
      <PolicyParameterSelectorView
        policy={POLICY_WITH_CHANGE}
        onPolicyUpdate={vi.fn()}
        onNext={onNext}
      />
    );

    const reviewButton = screen.getByRole('button', { name: /review my policy/i });
    expect(reviewButton).toBeEnabled();
    fireEvent.click(reviewButton);
    expect(onNext).toHaveBeenCalledOnce();
  });

  test('given a mobile policy matches current law then review is disabled with a reason', () => {
    mockIsMobile.mockReturnValue(true);
    render(
      <PolicyParameterSelectorView
        policy={POLICY_MATCHING_CURRENT_LAW}
        onPolicyUpdate={vi.fn()}
        onNext={vi.fn()}
      />
    );

    const reviewButton = screen.getByRole('button', { name: /^review$/i });
    expect(reviewButton).toBeDisabled();
    expect(reviewButton).toHaveAccessibleDescription(/match current law/i);
    expect(screen.getByRole('status')).toHaveTextContent(/match current law/i);
  });
});

import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PolicyParameterSelectorValueSetter from '@/pathways/report/components/PolicyParameterSelectorValueSetter';
import type { PolicyStateProps } from '@/types/pathwayState';

const mockReduxState = {
  metadata: {
    parameters: {
      'gov.test.amount': {
        label: 'Test amount',
        type: 'parameter',
        parameter: 'gov.test.amount',
        unit: 'currency-USD',
        values: {
          '2025-01-01': 100,
          '2026-07-01': 200,
        },
      },
    },
    economyOptions: {
      time_period: [
        { name: 2025, label: '2025' },
        { name: 2026, label: '2026' },
      ],
    },
  },
};

vi.mock('react-redux', async () => {
  const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
  return {
    ...actual,
    useSelector: (selector: (state: typeof mockReduxState) => unknown) => selector(mockReduxState),
  };
});

vi.mock('@/pathways/report/components/valueSetters', () => ({
  ValueSetterMode: { DEFAULT: 'default' },
  ModeSelectorButton: () => null,
  ValueSetterComponents: {
    default: ({ setIntervals }: { setIntervals: (intervals: unknown[]) => void }) => (
      <div>
        <button
          type="button"
          onClick={() =>
            setIntervals([{ startDate: '2025-01-01', endDate: '2025-12-31', value: 100 }])
          }
        >
          Stage matching value
        </button>
        <button
          type="button"
          onClick={() =>
            setIntervals([{ startDate: '2025-01-01', endDate: '2026-12-31', value: 100 }])
          }
        >
          Stage value across transition
        </button>
      </div>
    ),
  },
}));

const PARAMETER = mockReduxState.metadata.parameters['gov.test.amount'];

describe('PolicyParameterSelectorValueSetter', () => {
  const onPolicyUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given a staged value matches current law then stores no parameter and explains why', async () => {
    const user = userEvent.setup();
    const policy: PolicyStateProps = { label: 'Test policy', parameters: [] };
    render(
      <PolicyParameterSelectorValueSetter
        param={PARAMETER}
        policy={policy}
        onPolicyUpdate={onPolicyUpdate}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Stage matching value' }));
    await user.click(screen.getByRole('button', { name: 'Add parameter' }));

    expect(onPolicyUpdate).toHaveBeenCalledWith({ ...policy, parameters: [] });
    expect(screen.getByRole('status')).toHaveTextContent(/matches current law/i);
  });

  test('given current law changes inside a staged range then stores only the effective segment', async () => {
    const user = userEvent.setup();
    const policy: PolicyStateProps = { label: 'Test policy', parameters: [] };
    render(
      <PolicyParameterSelectorValueSetter
        param={PARAMETER}
        policy={policy}
        onPolicyUpdate={onPolicyUpdate}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Stage value across transition' }));
    await user.click(screen.getByRole('button', { name: 'Add parameter' }));

    await waitFor(() =>
      expect(onPolicyUpdate).toHaveBeenCalledWith({
        ...policy,
        parameters: [
          {
            name: 'gov.test.amount',
            values: [{ startDate: '2026-07-01', endDate: '2026-12-31', value: 100 }],
          },
        ],
      })
    );
  });

  test('given a matching value replaces an existing change then removes that change', async () => {
    const user = userEvent.setup();
    const policy: PolicyStateProps = {
      label: 'Test policy',
      parameters: [
        {
          name: 'gov.test.amount',
          values: [{ startDate: '2025-01-01', endDate: '2025-12-31', value: 150 }],
        },
      ],
    };
    render(
      <PolicyParameterSelectorValueSetter
        param={PARAMETER}
        policy={policy}
        onPolicyUpdate={onPolicyUpdate}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Stage matching value' }));
    await user.click(screen.getByRole('button', { name: 'Add parameter' }));

    expect(onPolicyUpdate).toHaveBeenCalledWith({ ...policy, parameters: [] });
  });
});

import type { ComponentProps } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@test-utils';
import { describe, expect, test } from 'vitest';
import SavedReformView, { savedReformSummary } from '@/components/flagship/SavedReformView';

/** When the reform was saved: Oct 12, 2026. */
const SAVED_AT = '2026-10-12T10:00:00+00:00';

const REFORM_NAME = 'Bigger CTC';

/** The one parameter the reform sets: the CTC's base amount at $3,600 from 2026. */
const CHANGED_PARAMETER = {
  name: 'gov.irs.credits.ctc.amount.base',
  values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
};

const REMOVED_PARAMETER = 'gov.irs.credits.ctc.removed';

/** A saved reform whose changes are read, shown without the model's metadata. */
const READ_CHANGES: ComponentProps<typeof SavedReformView>['changes'] = {
  read: true,
  parameters: [CHANGED_PARAMETER],
  missingParameters: [],
  metadataReady: true,
  metadataFailed: false,
  onRetryMetadata: () => undefined,
  withoutMetadata: true,
};

function renderView(overrides: Partial<ComponentProps<typeof SavedReformView>> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SavedReformView
        name={REFORM_NAME}
        savedAt={SAVED_AT}
        subject="This reform"
        reformHeading="Your reform"
        changes={READ_CHANGES}
        reports={{ countryId: 'us', reports: [], emptyNote: 'No reports yet.' }}
        {...overrides}
      />
    </QueryClientProvider>
  );
}

/** Whether every element follows the one before it in the document. */
function inDocumentOrder(elements: HTMLElement[]): boolean {
  return elements.every(
    (element, index) =>
      index === 0 ||
      Boolean(
        elements[index - 1].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING
      )
  );
}

describe('savedReformSummary', () => {
  test.each([
    { changes: { count: 1 }, savedAt: SAVED_AT, summary: '1 provision · saved Oct 12, 2026' },
    { changes: { count: 3 }, savedAt: SAVED_AT, summary: '3 provisions · saved Oct 12, 2026' },
    { changes: { count: 2 }, savedAt: null, summary: '2 provisions' },
    {
      changes: 'unavailable' as const,
      savedAt: SAVED_AT,
      summary: 'Changes could not be loaded · saved Oct 12, 2026',
    },
    { changes: 'unavailable' as const, savedAt: undefined, summary: 'Changes could not be loaded' },
    { changes: 'reading' as const, savedAt: SAVED_AT, summary: 'Saved Oct 12, 2026' },
  ])(
    'given changes $changes saved at $savedAt then the summary reads "$summary"',
    ({ changes, savedAt, summary }) => {
      expect(savedReformSummary(changes, savedAt)).toBe(summary);
    }
  );
});

describe('SavedReformView', () => {
  test('given a saved reform then it shows its name, its summary, the notice of removed parameters, its notes, its parameters, its actions and its reports, in that order', () => {
    // When
    renderView({
      lead: <a href="/us/reforms">Back to reforms</a>,
      changes: { ...READ_CHANGES, missingParameters: [REMOVED_PARAMETER] },
      notes: <p>A note about the reform</p>,
      actions: <button type="button">Run the report</button>,
    });

    // Then
    expect(
      inDocumentOrder([
        screen.getByRole('link', { name: 'Back to reforms' }),
        screen.getByRole('heading', { level: 1, name: REFORM_NAME }),
        screen.getByText('1 provision · saved Oct 12, 2026'),
        screen.getByRole('alert'),
        screen.getByText('A note about the reform'),
        screen.getByRole('table', { name: 'Parameters' }),
        screen.getByRole('button', { name: 'Run the report' }),
        screen.getByRole('region', { name: 'Reports' }),
      ])
    ).toBe(true);
    expect(screen.getByRole('alert')).toHaveTextContent(REMOVED_PARAMETER);
  });

  test("given the reform's changes are still being read then its placeholder shows where its parameters go, and the summary gives only the date", () => {
    // When
    renderView({
      changes: { read: false, unavailable: false, placeholder: <p>Loading the changes…</p> },
    });

    // Then
    expect({
      summary: screen.getByText(/saved/i).textContent,
      placeholder: screen.getByText('Loading the changes…'),
      table: screen.queryByRole('table', { name: 'Parameters' }),
    }).toEqual({
      summary: 'Saved Oct 12, 2026',
      placeholder: expect.any(HTMLElement),
      table: null,
    });
  });

  test("given the reform's changes could not be loaded then its summary says so", () => {
    // When
    renderView({
      changes: { read: false, unavailable: true, placeholder: <p>Could not read it.</p> },
    });

    // Then
    expect(
      screen.getByText('Changes could not be loaded · saved Oct 12, 2026')
    ).toBeInTheDocument();
  });

  test('given wrappers for the title and the summary then each wraps its part of the heading', () => {
    // When
    renderView({
      wrapTitle: (title) => <section aria-label="Title wrapper">{title}</section>,
      wrapSummary: (summary) => <section aria-label="Summary wrapper">{summary}</section>,
    });

    // Then
    expect({
      title: within(screen.getByRole('region', { name: 'Title wrapper' })).getByRole('heading', {
        level: 1,
      }).textContent,
      summary: screen.getByRole('region', { name: 'Summary wrapper' }).textContent,
    }).toEqual({ title: REFORM_NAME, summary: '1 provision · saved Oct 12, 2026' });
  });

  test('given a name without spaces then the title wraps rather than overflowing', () => {
    // When
    renderView({ name: 'CTC_to_3600_for_children_under_6_without_any_spaces' });

    // Then
    expect(screen.getByRole('heading', { level: 1 }).style.overflowWrap).toBe('anywhere');
  });
});

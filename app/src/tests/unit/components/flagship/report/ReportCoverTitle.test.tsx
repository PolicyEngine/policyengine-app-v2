import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ReportCoverTitle from '@/components/flagship/report/ReportCoverTitle';
import {
  BLANK_REPORT_TITLE,
  RENAMED_REPORT_TITLE,
  UNTRIMMED_RENAMED_REPORT_TITLE,
} from '@/tests/fixtures/libs/flagship/reportRenameMocks';

const REPORT_NAME = 'CTC expansion';
const CHILD_TAX_CREDIT_HEADING = 'Increasing the Child Tax Credit';

describe('ReportCoverTitle', () => {
  test('given no rename then the cover reads the heading with no rename control', () => {
    render(<ReportCoverTitle heading={REPORT_NAME} name={REPORT_NAME} />);

    expect(screen.getByRole('heading', { level: 1, name: REPORT_NAME })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rename report' })).not.toBeInTheDocument();
  });

  test('given the owner types a new name and presses Enter then it is saved trimmed', async () => {
    // Given
    const user = userEvent.setup();
    const handleRename = vi.fn().mockResolvedValue(undefined);
    render(<ReportCoverTitle heading={REPORT_NAME} name={REPORT_NAME} onRename={handleRename} />);

    // When
    await user.click(screen.getByRole('button', { name: 'Rename report' }));
    const nameField = screen.getByRole('textbox', { name: 'Report name' });
    await user.clear(nameField);
    await user.type(nameField, `${UNTRIMMED_RENAMED_REPORT_TITLE}{Enter}`);

    // Then
    expect(handleRename).toHaveBeenCalledExactlyOnceWith(RENAMED_REPORT_TITLE);
    expect(screen.queryByRole('textbox', { name: 'Report name' })).not.toBeInTheDocument();
  });

  test('given the owner opens the name then it starts from the current name', async () => {
    const user = userEvent.setup();
    render(<ReportCoverTitle heading={REPORT_NAME} name={REPORT_NAME} onRename={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Rename report' }));

    expect(screen.getByRole('textbox', { name: 'Report name' })).toHaveValue(REPORT_NAME);
  });

  test('given the owner presses Escape then nothing is saved and the name stays', async () => {
    // Given
    const user = userEvent.setup();
    const handleRename = vi.fn();
    render(<ReportCoverTitle heading={REPORT_NAME} name={REPORT_NAME} onRename={handleRename} />);

    // When
    await user.click(screen.getByRole('button', { name: 'Rename report' }));
    await user.type(screen.getByRole('textbox', { name: 'Report name' }), ' draft{Escape}');

    // Then
    expect(handleRename).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1, name: REPORT_NAME })).toBeInTheDocument();
  });

  test.each([
    ['blank', BLANK_REPORT_TITLE],
    ['unchanged', REPORT_NAME],
  ])('given a %s name then nothing is saved', async (_case, typedName) => {
    // Given
    const user = userEvent.setup();
    const handleRename = vi.fn();
    render(<ReportCoverTitle heading={REPORT_NAME} name={REPORT_NAME} onRename={handleRename} />);

    // When
    await user.click(screen.getByRole('button', { name: 'Rename report' }));
    const nameField = screen.getByRole('textbox', { name: 'Report name' });
    await user.clear(nameField);
    await user.type(nameField, `${typedName}{Enter}`);

    // Then
    expect(handleRename).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1, name: REPORT_NAME })).toBeInTheDocument();
  });

  test('given the save fails then it says so and keeps the typed name', async () => {
    // Given
    const user = userEvent.setup();
    const handleRename = vi
      .fn()
      .mockRejectedValue(new Error('Saved work is temporarily unavailable.'));
    render(<ReportCoverTitle heading={REPORT_NAME} name={REPORT_NAME} onRename={handleRename} />);

    // When
    await user.click(screen.getByRole('button', { name: 'Rename report' }));
    const nameField = screen.getByRole('textbox', { name: 'Report name' });
    await user.clear(nameField);
    await user.type(nameField, `${RENAMED_REPORT_TITLE}{Enter}`);

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not rename the report. Try again.'
    );
    expect(screen.getByRole('textbox', { name: 'Report name' })).toHaveValue(RENAMED_REPORT_TITLE);
  });

  test('given a cover heading other than the name then the name shows under it to rename', async () => {
    // Given
    const user = userEvent.setup();
    const handleRename = vi.fn().mockResolvedValue(undefined);
    render(
      <ReportCoverTitle
        heading={CHILD_TAX_CREDIT_HEADING}
        name={REPORT_NAME}
        onRename={handleRename}
      />
    );

    // When
    await user.click(screen.getByRole('button', { name: 'Rename report' }));
    const nameField = screen.getByRole('textbox', { name: 'Report name' });
    await user.clear(nameField);
    await user.type(nameField, `${RENAMED_REPORT_TITLE}{Enter}`);

    // Then: the cover keeps its heading; the name under it is what was renamed
    expect(
      screen.getByRole('heading', { level: 1, name: CHILD_TAX_CREDIT_HEADING })
    ).toBeInTheDocument();
    expect(handleRename).toHaveBeenCalledExactlyOnceWith(RENAMED_REPORT_TITLE);
  });

  test('given a cover heading other than the name then the name is shown', () => {
    render(
      <ReportCoverTitle heading={CHILD_TAX_CREDIT_HEADING} name={REPORT_NAME} onRename={vi.fn()} />
    );

    expect(screen.getByText(`Report name: ${REPORT_NAME}`)).toBeInTheDocument();
  });
});

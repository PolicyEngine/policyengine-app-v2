import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MapDownloadMenu } from '@/components/MapDownloadMenu';
import {
  createNullRef,
  createPopulatedRef,
  MENU_LABELS,
  mockDownloadMapAsPng,
  mockDownloadMapAsSvg,
  resetExportMocks,
  TEST_FILENAME,
} from '@/tests/fixtures/components/mapDownloadMenuMocks';

vi.mock('@/utils/mapExportUtils', () => ({
  downloadMapAsPng: (...args: unknown[]) => mockDownloadMapAsPng(...args),
  downloadMapAsSvg: (...args: unknown[]) => mockDownloadMapAsSvg(...args),
}));

describe('MapDownloadMenu', () => {
  beforeEach(() => {
    resetExportMocks();
  });

  test('given valid props then renders download button', () => {
    // Given
    const mapRef = createPopulatedRef();

    // When
    render(<MapDownloadMenu mapRef={mapRef} filename={TEST_FILENAME} />);

    // Then
    expect(screen.getByRole('button', { name: MENU_LABELS.DOWNLOAD_MAP })).toBeInTheDocument();
  });

  test('given user clicks download button then menu opens with PNG and SVG options', async () => {
    // Given
    const user = userEvent.setup();
    const mapRef = createPopulatedRef();
    render(<MapDownloadMenu mapRef={mapRef} filename={TEST_FILENAME} />);

    // When
    await user.click(screen.getByRole('button', { name: MENU_LABELS.DOWNLOAD_MAP }));

    // Then
    expect(screen.getByText(MENU_LABELS.DOWNLOAD_PNG)).toBeInTheDocument();
    expect(screen.getByText(MENU_LABELS.DOWNLOAD_SVG)).toBeInTheDocument();
  });

  test('given user clicks Download PNG then calls downloadMapAsPng with node and filename', async () => {
    // Given
    const user = userEvent.setup();
    const mapRef = createPopulatedRef();
    render(<MapDownloadMenu mapRef={mapRef} filename={TEST_FILENAME} />);

    // When
    await user.click(screen.getByRole('button', { name: MENU_LABELS.DOWNLOAD_MAP }));
    await user.click(screen.getByText(MENU_LABELS.DOWNLOAD_PNG));

    // Then
    expect(mockDownloadMapAsPng).toHaveBeenCalledWith(mapRef.current, {
      filename: TEST_FILENAME,
    });
  });

  test('given user clicks Download SVG then calls downloadMapAsSvg with node and filename', async () => {
    // Given
    const user = userEvent.setup();
    const mapRef = createPopulatedRef();
    render(<MapDownloadMenu mapRef={mapRef} filename={TEST_FILENAME} />);

    // When
    await user.click(screen.getByRole('button', { name: MENU_LABELS.DOWNLOAD_MAP }));
    await user.click(screen.getByText(MENU_LABELS.DOWNLOAD_SVG));

    // Then
    expect(mockDownloadMapAsSvg).toHaveBeenCalledWith(mapRef.current, {
      filename: TEST_FILENAME,
    });
  });

  test('given null ref then does not call export function on PNG click', async () => {
    // Given
    const user = userEvent.setup();
    const mapRef = createNullRef();
    render(<MapDownloadMenu mapRef={mapRef} filename={TEST_FILENAME} />);

    // When
    await user.click(screen.getByRole('button', { name: MENU_LABELS.DOWNLOAD_MAP }));
    await user.click(screen.getByText(MENU_LABELS.DOWNLOAD_PNG));

    // Then
    expect(mockDownloadMapAsPng).not.toHaveBeenCalled();
  });

  test('given null ref then does not call export function on SVG click', async () => {
    // Given
    const user = userEvent.setup();
    const mapRef = createNullRef();
    render(<MapDownloadMenu mapRef={mapRef} filename={TEST_FILENAME} />);

    // When
    await user.click(screen.getByRole('button', { name: MENU_LABELS.DOWNLOAD_MAP }));
    await user.click(screen.getByText(MENU_LABELS.DOWNLOAD_SVG));

    // Then
    expect(mockDownloadMapAsSvg).not.toHaveBeenCalled();
  });
});

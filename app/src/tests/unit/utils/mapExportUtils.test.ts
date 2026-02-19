import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createMockContainer,
  CUSTOM_BACKGROUND_COLOR,
  CUSTOM_PIXEL_RATIO,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_PIXEL_RATIO,
  mockLinkClick,
  mockToPng,
  mockToSvg,
  resetHtmlToImageMocks,
  setupDownloadSpy,
  TEST_DATA_URLS,
  TEST_FILENAMES,
} from '@/tests/fixtures/utils/mapExportMocks';
// Import after mock setup so the module binds to our mocks
import { downloadMapAsPng, downloadMapAsSvg } from '@/utils/mapExportUtils';

vi.mock('html-to-image', () => ({
  toPng: (...args: unknown[]) => mockToPng(...args),
  toSvg: (...args: unknown[]) => mockToSvg(...args),
}));

describe('mapExportUtils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockLinkClick.mockReset();
    resetHtmlToImageMocks();
  });

  describe('downloadMapAsPng', () => {
    test('given a container node then calls toPng with default options', async () => {
      // Given
      const container = createMockContainer();
      setupDownloadSpy();

      // When
      await downloadMapAsPng(container, { filename: TEST_FILENAMES.ABSOLUTE_DISTRICT });

      // Then
      expect(mockToPng).toHaveBeenCalledWith(container, {
        backgroundColor: DEFAULT_BACKGROUND_COLOR,
        pixelRatio: DEFAULT_PIXEL_RATIO,
      });
    });

    test('given custom options then passes them to toPng', async () => {
      // Given
      const container = createMockContainer();
      setupDownloadSpy();

      // When
      await downloadMapAsPng(container, {
        filename: TEST_FILENAMES.ABSOLUTE_DISTRICT,
        backgroundColor: CUSTOM_BACKGROUND_COLOR,
        pixelRatio: CUSTOM_PIXEL_RATIO,
      });

      // Then
      expect(mockToPng).toHaveBeenCalledWith(container, {
        backgroundColor: CUSTOM_BACKGROUND_COLOR,
        pixelRatio: CUSTOM_PIXEL_RATIO,
      });
    });

    test('given successful export then triggers download with .png extension', async () => {
      // Given
      const container = createMockContainer();
      const { getLastAnchor } = setupDownloadSpy();

      // When
      await downloadMapAsPng(container, { filename: TEST_FILENAMES.ABSOLUTE_DISTRICT });

      // Then
      const anchor = getLastAnchor();
      expect(anchor).not.toBeNull();
      expect(anchor!.href).toContain(TEST_DATA_URLS.PNG);
      expect(anchor!.download).toBe(`${TEST_FILENAMES.ABSOLUTE_DISTRICT}.png`);
      expect(mockLinkClick).toHaveBeenCalledOnce();
    });
  });

  describe('downloadMapAsSvg', () => {
    test('given a container node then calls toSvg with default background', async () => {
      // Given
      const container = createMockContainer();
      setupDownloadSpy();

      // When
      await downloadMapAsSvg(container, { filename: TEST_FILENAMES.RELATIVE_CONSTITUENCY });

      // Then
      expect(mockToSvg).toHaveBeenCalledWith(container, {
        backgroundColor: DEFAULT_BACKGROUND_COLOR,
      });
    });

    test('given successful export then triggers download with .svg extension', async () => {
      // Given
      const container = createMockContainer();
      const { getLastAnchor } = setupDownloadSpy();

      // When
      await downloadMapAsSvg(container, { filename: TEST_FILENAMES.RELATIVE_CONSTITUENCY });

      // Then
      const anchor = getLastAnchor();
      expect(anchor).not.toBeNull();
      expect(anchor!.href).toContain(TEST_DATA_URLS.SVG);
      expect(anchor!.download).toBe(`${TEST_FILENAMES.RELATIVE_CONSTITUENCY}.svg`);
      expect(mockLinkClick).toHaveBeenCalledOnce();
    });
  });

  describe('tooltip exclusion', () => {
    test('given container with tooltip then hides it during export', async () => {
      // Given
      const container = createMockContainer({ withTooltip: true });
      const tooltip = container.querySelector('[data-export-exclude]') as HTMLElement;
      setupDownloadSpy();

      // Capture the tooltip display state during the toPng call
      let displayDuringExport: string | undefined;
      mockToPng.mockImplementation(async () => {
        displayDuringExport = tooltip.style.display;
        return TEST_DATA_URLS.PNG;
      });

      // When
      await downloadMapAsPng(container, { filename: TEST_FILENAMES.ABSOLUTE_DISTRICT });

      // Then
      expect(displayDuringExport).toBe('none');
    });

    test('given container with tooltip then restores display after export', async () => {
      // Given
      const container = createMockContainer({ withTooltip: true });
      const tooltip = container.querySelector('[data-export-exclude]') as HTMLElement;
      tooltip.style.display = 'block';
      setupDownloadSpy();

      // When
      await downloadMapAsPng(container, { filename: TEST_FILENAMES.ABSOLUTE_DISTRICT });

      // Then
      expect(tooltip.style.display).toBe('block');
    });

    test('given container with multiple excluded elements then hides all during export', async () => {
      // Given
      const container = createMockContainer({ withMultipleExcluded: true });
      const excluded = container.querySelectorAll('[data-export-exclude]');
      setupDownloadSpy();

      let allHiddenDuringExport = false;
      mockToPng.mockImplementation(async () => {
        allHiddenDuringExport = Array.from(excluded).every(
          (el) => (el as HTMLElement).style.display === 'none'
        );
        return TEST_DATA_URLS.PNG;
      });

      // When
      await downloadMapAsPng(container, { filename: TEST_FILENAMES.ABSOLUTE_DISTRICT });

      // Then
      expect(allHiddenDuringExport).toBe(true);
    });

    test('given export throws error then still restores tooltip display', async () => {
      // Given
      const container = createMockContainer({ withTooltip: true });
      const tooltip = container.querySelector('[data-export-exclude]') as HTMLElement;
      tooltip.style.display = 'block';
      setupDownloadSpy();
      mockToPng.mockRejectedValue(new Error('Export failed'));

      // When
      await expect(
        downloadMapAsPng(container, { filename: TEST_FILENAMES.ABSOLUTE_DISTRICT })
      ).rejects.toThrow('Export failed');

      // Then
      expect(tooltip.style.display).toBe('block');
    });

    test('given container without excluded elements then export proceeds normally', async () => {
      // Given
      const container = createMockContainer();
      setupDownloadSpy();

      // When
      await downloadMapAsPng(container, { filename: TEST_FILENAMES.ABSOLUTE_DISTRICT });

      // Then
      expect(mockToPng).toHaveBeenCalledOnce();
      expect(mockLinkClick).toHaveBeenCalledOnce();
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EXPECTED_LABEL_DEFAULT,
  EXPECTED_LABEL_WITH_DESCRIPTIVE,
  EXPECTED_LABEL_WITH_ID_0,
  EXPECTED_LABEL_WITH_ID_7,
  EXPECTED_LABEL_WITH_ID_12345,
  EXPECTED_LABEL_WITH_SHORT,
  SAMPLE_POLICY_ID_NULL,
  SAMPLE_POLICY_ID_POSITIVE,
  SAMPLE_POLICY_ID_SINGLE_DIGIT,
  SAMPLE_POLICY_ID_UNDEFINED,
  SAMPLE_POLICY_ID_ZERO,
  SAMPLE_POLICY_LABEL_DESCRIPTIVE,
  SAMPLE_POLICY_LABEL_EMPTY_STRING,
  SAMPLE_POLICY_LABEL_SHORT,
} from '@/tests/fixtures/utils/chartUtilsMocks';
import {
  buildCsvContent,
  CHART_EXPORT_KEEP,
  downloadChartAsSvg,
  getChartLogoImage,
  getNiceTicks,
  getReformPolicyLabel,
} from '@/utils/chartUtils';

describe('chartUtils', () => {
  describe('getReformPolicyLabel', () => {
    describe('priority: policy label', () => {
      it('given policy label then returns policy label', () => {
        // Given/When
        const result = getReformPolicyLabel(SAMPLE_POLICY_LABEL_DESCRIPTIVE);

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_DESCRIPTIVE);
      });

      it('given short policy label then returns short label', () => {
        // Given/When
        const result = getReformPolicyLabel(SAMPLE_POLICY_LABEL_SHORT);

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_SHORT);
      });

      it('given policy label and policy ID then prioritizes label', () => {
        // Given/When
        const result = getReformPolicyLabel(
          SAMPLE_POLICY_LABEL_DESCRIPTIVE,
          SAMPLE_POLICY_ID_POSITIVE
        );

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_DESCRIPTIVE);
      });

      it('given empty string label then falls back to policy ID', () => {
        // Given/When
        const result = getReformPolicyLabel(
          SAMPLE_POLICY_LABEL_EMPTY_STRING,
          SAMPLE_POLICY_ID_POSITIVE
        );

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_ID_12345);
      });
    });

    describe('priority: policy ID', () => {
      it('given policy ID without label then returns formatted ID', () => {
        // Given/When
        const result = getReformPolicyLabel(undefined, SAMPLE_POLICY_ID_POSITIVE);

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_ID_12345);
      });

      it('given single-digit policy ID then formats correctly', () => {
        // Given/When
        const result = getReformPolicyLabel(undefined, SAMPLE_POLICY_ID_SINGLE_DIGIT);

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_ID_7);
      });

      it('given policy ID 0 then formats correctly', () => {
        // Given/When
        const result = getReformPolicyLabel(undefined, SAMPLE_POLICY_ID_ZERO);

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_ID_0);
      });

      it('given null label and valid policy ID then returns formatted ID', () => {
        // Given/When
        const result = getReformPolicyLabel(null, SAMPLE_POLICY_ID_POSITIVE);

        // Then
        expect(result).toBe(EXPECTED_LABEL_WITH_ID_12345);
      });
    });

    describe('default: "Reform"', () => {
      it('given no arguments then returns default label', () => {
        // Given/When
        const result = getReformPolicyLabel();

        // Then
        expect(result).toBe(EXPECTED_LABEL_DEFAULT);
      });

      it('given undefined label and undefined ID then returns default', () => {
        // Given/When
        const result = getReformPolicyLabel(SAMPLE_POLICY_ID_UNDEFINED, SAMPLE_POLICY_ID_UNDEFINED);

        // Then
        expect(result).toBe(EXPECTED_LABEL_DEFAULT);
      });

      it('given null label and null ID then returns default', () => {
        // Given/When
        const result = getReformPolicyLabel(SAMPLE_POLICY_ID_NULL, SAMPLE_POLICY_ID_NULL);

        // Then
        expect(result).toBe(EXPECTED_LABEL_DEFAULT);
      });

      it('given empty string label and null ID then returns default', () => {
        // Given/When
        const result = getReformPolicyLabel(
          SAMPLE_POLICY_LABEL_EMPTY_STRING,
          SAMPLE_POLICY_ID_NULL
        );

        // Then
        expect(result).toBe(EXPECTED_LABEL_DEFAULT);
      });
    });
  });

  describe('buildCsvContent', () => {
    it('given numeric, empty, and quoted cells then writes escaped CSV content', () => {
      expect(
        buildCsvContent([
          ['Label', 'Value'],
          ['Federal "tax" revenues', 1.25],
          ['Empty', null],
        ])
      ).toBe('"Label","Value"\r\n"Federal ""tax"" revenues","1.25"\r\n"Empty",""');
    });
  });

  describe('getChartLogoImage', () => {
    it('given no arguments then returns logo image config with default size', () => {
      // Given/When
      const result = getChartLogoImage();

      // Then
      expect(result).toEqual({
        source: '/assets/logos/policyengine/teal.png',
        xref: 'paper',
        yref: 'paper',
        x: 1,
        y: -0.18,
        sizex: 0.1,
        sizey: 0.1,
        xanchor: 'right',
        yanchor: 'bottom',
        opacity: 0.8,
      });
    });

    it('given custom size then returns logo image config with custom size', () => {
      // Given/When
      const result = getChartLogoImage({ sizex: 0.15, sizey: 0.15 });

      // Then
      expect(result.sizex).toBe(0.15);
      expect(result.sizey).toBe(0.15);
      expect(result.source).toBe('/assets/logos/policyengine/teal.png');
    });

    it('given custom opacity then returns logo image config with custom opacity', () => {
      // Given/When
      const result = getChartLogoImage({ opacity: 0.5 });

      // Then
      expect(result.opacity).toBe(0.5);
    });

    it('given custom position then returns logo image config with custom position', () => {
      // Given/When
      const result = getChartLogoImage({ x: 0.5, y: 0.5 });

      // Then
      expect(result.x).toBe(0.5);
      expect(result.y).toBe(0.5);
    });
  });

  describe('getNiceTicks', () => {
    it('given [0, 14] with 5 ticks then snaps to multiples of 5 covering the domain', () => {
      expect(getNiceTicks([0, 14], 5)).toEqual([0, 5, 10, 15]);
    });

    it('given [0, 20] with 5 ticks then returns clean multiples of 5', () => {
      expect(getNiceTicks([0, 20], 5)).toEqual([0, 5, 10, 15, 20]);
    });

    it('given [-5, 5] with 5 ticks then returns multiples of 2.5', () => {
      expect(getNiceTicks([-5, 5], 5)).toEqual([-5, -2.5, 0, 2.5, 5]);
    });

    it('given [0, 1] with 5 ticks then returns multiples of 0.25', () => {
      expect(getNiceTicks([0, 1], 5)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    });

    it('given [-0.3, 0.1] with 5 ticks then returns nice small values', () => {
      expect(getNiceTicks([-0.3, 0.1], 5)).toEqual([-0.3, -0.2, -0.1, 0, 0.1]);
    });

    it('given equal domain then returns single tick', () => {
      expect(getNiceTicks([5, 5], 5)).toEqual([5]);
    });

    it('given domain with 10% headroom then last tick covers the padded max', () => {
      // Given — data ranges from 0 to 3, with 10% headroom applied (maxY = 3.3)
      const paddedDomain: [number, number] = [0, 3.3];

      // When
      const ticks = getNiceTicks(paddedDomain);

      // Then — last tick must be at or above the padded max so headroom is visible
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(3.3);
    });

    it('given small padded domain then last tick covers the padded max', () => {
      // Given — data ranges from 0 to 0.22 (percentage), padded to 1.1
      const paddedDomain: [number, number] = [0, 1.1];

      // When
      const ticks = getNiceTicks(paddedDomain);

      // Then
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(1.1);
    });

    it('given large padded domain then last tick covers the padded max', () => {
      // Given — data ranges from 0 to 50000, padded to 55000
      const paddedDomain: [number, number] = [0, 55000];

      // When
      const ticks = getNiceTicks(paddedDomain);

      // Then
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(55000);
    });
  });

  describe('downloadChartAsSvg', () => {
    /** A container with one SVG of the given size, marked to keep or not. */
    function containerWith(size: { width: number; height: number }, keep: boolean) {
      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      if (keep) {
        Object.entries(CHART_EXPORT_KEEP).forEach(([name, value]) =>
          wrapper.setAttribute(name, value)
        );
      }
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('data-size', `${size.width}x${size.height}`);
      svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
      wrapper.appendChild(svg);
      container.appendChild(wrapper);
      document.body.appendChild(container);
      return container;
    }

    /** Whether a download was made, and how many chart SVGs it holds. */
    function download(container: HTMLElement): number | null {
      let content: string | null = null;
      const OriginalBlob = globalThis.Blob;
      vi.stubGlobal(
        'Blob',
        class extends OriginalBlob {
          constructor(parts: BlobPart[], options?: BlobPropertyBag) {
            super(parts, options);
            content = parts.join('');
          }
        }
      );
      Object.assign(URL, { createObjectURL: () => 'blob:chart', revokeObjectURL: () => undefined });
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
      downloadChartAsSvg(container);
      vi.unstubAllGlobals();
      return content === null ? null : ((content as string).match(/<rect\/?/g) ?? []).length - 1;
    }

    beforeEach(() => {
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: Element
      ) {
        const [width, height] = (this.getAttribute('data-size') ?? '0x0').split('x').map(Number);
        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: width,
          bottom: height,
          width,
          height,
        } as DOMRect;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      document.body.innerHTML = '';
    });

    it('given a chart SVG then it is exported', () => {
      expect(download(containerWith({ width: 546, height: 153 }, false))).toBe(1);
    });

    it('given an unmarked SVG under 40px then it is skipped as an icon, as before', () => {
      expect(download(containerWith({ width: 546, height: 28 }, false))).toBeNull();
    });

    it('given a marked SVG under 40px then it is kept', () => {
      expect(download(containerWith({ width: 546, height: 28 }, true))).toBe(1);
    });

    it('given a marked SVG with no size then it is skipped', () => {
      expect(download(containerWith({ width: 0, height: 0 }, true))).toBeNull();
    });
  });
});

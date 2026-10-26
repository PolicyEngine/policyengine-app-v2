import { describe, expect, test } from 'vitest';
import {
  categoryAxisProps,
  fitCategoryName,
} from '@/components/flagship/report/charts/categoryAxis';

/** A text's width at 6px a character for every 10px of font: "Hispanic" at 12px is 57.6px. */
const measure = (text: string, fontSize: number) => text.length * fontSize * 0.6;

describe('fitCategoryName', () => {
  test('given room for the full name then it shows in full', () => {
    expect(fitCategoryName('Top 10% share', 'Top 10%', 120, { measure })).toEqual({
      lines: ['Top 10% share'],
      fontSize: 12,
    });
  });

  test('given room for the short name only then the short name shows', () => {
    expect(fitCategoryName('Top 10% share', 'Top 10%', 60, { measure }).lines).toEqual(['Top 10%']);
  });

  test('given room for neither on one line then the short name wraps at its spaces', () => {
    expect(fitCategoryName('State and local income taxes', 'State taxes', 45, { measure })).toEqual(
      { lines: ['State', 'taxes'], fontSize: 12 }
    );
  });

  test('given one word wider than its room then its font shrinks to fit', () => {
    expect(fitCategoryName('Hispanic', undefined, 50, { measure })).toEqual({
      lines: ['Hispanic'],
      fontSize: 10,
    });
  });

  test('given a compact card then the short name shows even where the full one fits', () => {
    expect(
      fitCategoryName('Working-age adults', 'Adults', 200, { measure, preferShort: true }).lines
    ).toEqual(['Adults']);
  });
});

describe('categoryAxisProps', () => {
  test('given any width then no name is dropped', () => {
    expect(categoryAxisProps(['Black', 'Hispanic'], 100, { measure }).interval).toBe(0);
  });

  test('given a name that wraps then the axis grows a line', () => {
    const oneLine = categoryAxisProps(['Net'], 300, { measure });
    const twoLines = categoryAxisProps(['Federal taxes', 'Net'], 120, { measure });

    expect(twoLines.height - oneLine.height).toBe(14);
  });
});

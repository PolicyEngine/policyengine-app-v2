import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import UKHexMapUnplacedNote from '@/components/report/UKHexMapUnplacedNote';
import { UK_HEX_MAP_UNPLACED_NOTES } from '@/tests/fixtures/components/report/UKHexMapUnplacedNoteMocks';

describe('UKHexMapUnplacedNote', () => {
  test('given every area placed then shows no note', () => {
    // When
    const { container } = render(
      <UKHexMapUnplacedNote level="constituency" areaCount={3} placedCount={3} />,
      'uk'
    );

    // Then
    expect(container).toBeEmptyDOMElement();
  });

  test('given one constituency not placed then says so, in the singular', () => {
    // When
    render(<UKHexMapUnplacedNote level="constituency" areaCount={3} placedCount={2} />, 'uk');

    // Then
    expect(
      screen.getByText(UK_HEX_MAP_UNPLACED_NOTES.ONE_OF_THREE_CONSTITUENCIES)
    ).toBeInTheDocument();
  });

  test('given two local authorities not placed then says how many, in the plural', () => {
    // When
    render(
      <UKHexMapUnplacedNote level="local_authority" areaCount={361} placedCount={359} />,
      'uk'
    );

    // Then
    expect(
      screen.getByText(UK_HEX_MAP_UNPLACED_NOTES.TWO_OF_361_LOCAL_AUTHORITIES)
    ).toBeInTheDocument();
  });

  test('given no area placed then says the map has no position for any', () => {
    // When
    render(<UKHexMapUnplacedNote level="constituency" areaCount={2} placedCount={0} />, 'uk');

    // Then
    expect(screen.getByText(UK_HEX_MAP_UNPLACED_NOTES.NO_CONSTITUENCY)).toBeInTheDocument();
  });

  test('given no areas at all then shows no note', () => {
    // When
    const { container } = render(
      <UKHexMapUnplacedNote level="constituency" areaCount={0} placedCount={0} />,
      'uk'
    );

    // Then
    expect(container).toBeEmptyDOMElement();
  });
});

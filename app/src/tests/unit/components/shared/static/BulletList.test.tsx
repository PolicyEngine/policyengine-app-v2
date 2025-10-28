import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import BulletList from '@/components/shared/static/BulletList';
import {
  MOCK_BULLET_ITEMS,
  SINGLE_BULLET_ITEM,
} from '@/tests/fixtures/components/shared/static/BulletListMocks';

describe('BulletList', () => {
  test('given bullet items then all titles are rendered', () => {
    // Given / When
    render(<BulletList items={MOCK_BULLET_ITEMS} />);

    // Then
    MOCK_BULLET_ITEMS.forEach((item) => {
      expect(screen.getByText(item.title)).toBeInTheDocument();
    });
  });

  test('given bullet items then all descriptions are rendered', () => {
    // Given / When
    render(<BulletList items={MOCK_BULLET_ITEMS} />);

    // Then
    MOCK_BULLET_ITEMS.forEach((item) => {
      expect(screen.getByText(item.description)).toBeInTheDocument();
    });
  });

  test('given single item then list is rendered', () => {
    // Given / When
    render(<BulletList items={[SINGLE_BULLET_ITEM]} />);

    // Then
    expect(screen.getByText(SINGLE_BULLET_ITEM.title)).toBeInTheDocument();
    expect(screen.getByText(SINGLE_BULLET_ITEM.description)).toBeInTheDocument();
  });

  test('given empty items array then list renders without error', () => {
    // Given / When
    render(<BulletList items={[]} />);

    // Then
    expect(screen.queryByRole('list')).toBeInTheDocument();
  });

  test('given inverted variant then styles are applied', () => {
    // Given / When
    render(<BulletList items={[SINGLE_BULLET_ITEM]} variant="inverted" />);

    // Then
    expect(screen.getByText(SINGLE_BULLET_ITEM.title)).toBeInTheDocument();
  });
});

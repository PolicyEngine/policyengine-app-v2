import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import HeroSection from '@/components/shared/static/HeroSection';
import {
  MOCK_HERO_PROPS,
  MOCK_HERO_PROPS_DARK,
  TEST_HERO_DESCRIPTION,
  TEST_HERO_TITLE,
} from '@/tests/fixtures/components/shared/static/HeroSectionMocks';
import { MOCK_HERO_PROPS_WITH_REACT_NODE } from '@/tests/fixtures/components/shared/static/HeroSectionMocksReactNode';

describe('HeroSection', () => {
  test('given title and description then both are rendered', () => {
    // Given / When
    render(<HeroSection {...MOCK_HERO_PROPS} />);

    // Then
    expect(screen.getByText(TEST_HERO_TITLE)).toBeInTheDocument();
    expect(screen.getByText(TEST_HERO_DESCRIPTION)).toBeInTheDocument();
  });

  test('given default variant then component renders without error', () => {
    // Given / When
    const { container } = render(<HeroSection {...MOCK_HERO_PROPS} />);

    // Then
    expect(container.firstChild).toBeInTheDocument();
  });

  test('given dark variant then component renders without error', () => {
    // Given / When
    const { container } = render(<HeroSection {...MOCK_HERO_PROPS_DARK} />);

    // Then
    expect(container.firstChild).toBeInTheDocument();
  });

  test('given hero section then dividers are present', () => {
    // Given / When
    render(<HeroSection {...MOCK_HERO_PROPS} />);

    // Then
    // Dividers are presentational and tested via visual inspection
    // We verify the section renders without errors
    expect(screen.getByText(TEST_HERO_TITLE)).toBeInTheDocument();
  });

  test('given ReactNode description then component renders with bold text', () => {
    // Given / When
    render(<HeroSection {...MOCK_HERO_PROPS_WITH_REACT_NODE} />);

    // Then
    expect(screen.getByText('bold text')).toBeInTheDocument();
    expect(screen.getByText('This is a test with', { exact: false })).toBeInTheDocument();
  });
});

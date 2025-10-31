import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import SupportedProject from '@/components/shared/static/SupportedProject';
import {
  FORMATTED_AMOUNT_GBP,
  FORMATTED_AMOUNT_USD,
  FORMATTED_DATE_JUNE_2024,
  FORMATTED_DATE_MARCH_2024,
  TEST_PROJECT_GBP,
  TEST_PROJECT_NO_URL,
  TEST_PROJECT_USD,
} from '@/tests/fixtures/components/shared/static/SupportersMocks';

describe('SupportedProject', () => {
  test('given project then title is rendered', () => {
    // Given / When
    render(<SupportedProject project={TEST_PROJECT_USD} />);

    // Then
    expect(screen.getByText(TEST_PROJECT_USD.title)).toBeInTheDocument();
  });

  test('given project with URL then title is a link', () => {
    // Given / When
    render(<SupportedProject project={TEST_PROJECT_USD} />);

    // Then
    const link = screen.getByRole('link', { name: TEST_PROJECT_USD.title });
    expect(link).toHaveAttribute('href', TEST_PROJECT_USD.projectUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('given project without URL then title is plain text', () => {
    // Given / When
    render(<SupportedProject project={TEST_PROJECT_NO_URL} />);

    // Then
    expect(screen.getByText(TEST_PROJECT_NO_URL.title)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: TEST_PROJECT_NO_URL.title })).not.toBeInTheDocument();
  });

  test('given USD project then amount displays with dollar sign', () => {
    // Given / When
    render(<SupportedProject project={TEST_PROJECT_USD} />);

    // Then
    expect(screen.getByText(FORMATTED_AMOUNT_USD, { exact: false })).toBeInTheDocument();
  });

  test('given GBP project then amount displays with pound sign', () => {
    // Given / When
    render(<SupportedProject project={TEST_PROJECT_GBP} />);

    // Then
    expect(screen.getByText(FORMATTED_AMOUNT_GBP, { exact: false })).toBeInTheDocument();
  });

  test('given project then formatted date is displayed', () => {
    // Given / When
    render(<SupportedProject project={TEST_PROJECT_USD} />);

    // Then
    expect(screen.getByText(FORMATTED_DATE_JUNE_2024, { exact: false })).toBeInTheDocument();
  });

  test('given GBP project then date is formatted correctly', () => {
    // Given / When
    render(<SupportedProject project={TEST_PROJECT_GBP} />);

    // Then
    expect(screen.getByText(FORMATTED_DATE_MARCH_2024, { exact: false })).toBeInTheDocument();
  });

  test('given project then description is rendered', () => {
    // Given / When
    render(<SupportedProject project={TEST_PROJECT_USD} />);

    // Then
    expect(screen.getByText(TEST_PROJECT_USD.description)).toBeInTheDocument();
  });

  test('given project then award label is displayed', () => {
    // Given / When
    render(<SupportedProject project={TEST_PROJECT_USD} />);

    // Then
    expect(screen.getByText('Award:', { exact: false })).toBeInTheDocument();
  });

  test('given project then date label is displayed', () => {
    // Given / When
    render(<SupportedProject project={TEST_PROJECT_USD} />);

    // Then
    expect(screen.getByText('Date:', { exact: false })).toBeInTheDocument();
  });
});

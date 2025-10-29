import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import SupporterCard from '@/components/shared/static/SupporterCard';
import {
  TEST_PROJECT_GBP,
  TEST_PROJECT_USD,
  TEST_SUPPORTER,
  TEST_SUPPORTER_NO_LOGO,
} from '@/tests/fixtures/components/shared/static/SupportersMocks';

describe('SupporterCard', () => {
  test('given supporter then name is rendered', () => {
    // Given / When
    render(<SupporterCard supporter={TEST_SUPPORTER} projects={[]} />);

    // Then
    expect(screen.getAllByText(TEST_SUPPORTER.name, { exact: false }).length).toBeGreaterThan(0);
  });

  test('given supporter then description is rendered', () => {
    // Given / When
    render(<SupporterCard supporter={TEST_SUPPORTER} projects={[]} />);

    // Then
    expect(screen.getByText(TEST_SUPPORTER.description, { exact: false })).toBeInTheDocument();
  });

  test('given supporter with logo then logo is rendered as link', () => {
    // Given / When
    render(<SupporterCard supporter={TEST_SUPPORTER} projects={[]} />);

    // Then
    const links = screen.getAllByRole('link');
    const logoLink = links.find((link) => link.getAttribute('href') === TEST_SUPPORTER.websiteUrl);
    expect(logoLink).toBeDefined();

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', TEST_SUPPORTER.logoUrl);
  });

  test('given supporter without logo then only name is displayed', () => {
    // Given / When
    render(<SupporterCard supporter={TEST_SUPPORTER_NO_LOGO} projects={[]} />);

    // Then
    expect(screen.getByText(TEST_SUPPORTER_NO_LOGO.name, { exact: false })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('given supporter with name link then name is clickable', () => {
    // Given / When
    render(<SupporterCard supporter={TEST_SUPPORTER_NO_LOGO} projects={[]} />);

    // Then
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', TEST_SUPPORTER_NO_LOGO.websiteUrl);
  });

  test('given projects then all projects are rendered', () => {
    // Given
    const projects = [TEST_PROJECT_USD, TEST_PROJECT_GBP];

    // When
    render(<SupporterCard supporter={TEST_SUPPORTER} projects={projects} />);

    // Then
    projects.forEach((project) => {
      expect(screen.getAllByText(project.title).length).toBeGreaterThan(0);
    });
  });

  test('given no projects then only supporter info is rendered', () => {
    // Given / When
    render(<SupporterCard supporter={TEST_SUPPORTER} projects={[]} />);

    // Then
    expect(screen.getAllByText(TEST_SUPPORTER.name, { exact: false }).length).toBeGreaterThan(0);
    expect(screen.queryByText('Award:')).not.toBeInTheDocument();
  });

  test('given supporter then component renders without error', () => {
    // Given / When
    const { container } = render(
      <SupporterCard supporter={TEST_SUPPORTER} projects={[TEST_PROJECT_USD]} />
    );

    // Then
    expect(container.firstChild).toBeInTheDocument();
  });
});

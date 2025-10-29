import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import TeamSection from '@/components/shared/static/TeamSection';
import { TEST_TEAM_MEMBERS } from '@/tests/fixtures/components/shared/static/TeamMocks';

describe('TeamSection', () => {
  test('given section title then title is rendered', () => {
    // Given
    const title = 'Our Team';

    // When
    render(<TeamSection title={title} members={TEST_TEAM_MEMBERS} />);

    // Then
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  test('given team members then all members are rendered', () => {
    // Given / When
    render(<TeamSection title="Test Section" members={TEST_TEAM_MEMBERS} />);

    // Then
    TEST_TEAM_MEMBERS.forEach((member) => {
      expect(screen.getByText(member.name)).toBeInTheDocument();
    });
  });

  test('given empty members array then only title is rendered', () => {
    // Given
    const title = 'Empty Section';

    // When
    render(<TeamSection title={title} members={[]} />);

    // Then
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('given primary variant then component renders without error', () => {
    // Given / When
    const { container } = render(
      <TeamSection title="Test" members={TEST_TEAM_MEMBERS} variant="primary" />
    );

    // Then
    expect(container.firstChild).toBeInTheDocument();
  });

  test('given secondary variant then component renders without error', () => {
    // Given / When
    const { container } = render(
      <TeamSection title="Test" members={TEST_TEAM_MEMBERS} variant="secondary" />
    );

    // Then
    expect(container.firstChild).toBeInTheDocument();
  });
});

import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import TeamMemberCard from '@/components/shared/static/TeamMemberCard';
import {
  TEST_TEAM_MEMBER,
  TEST_TEAM_MEMBER_NO_IMAGE,
} from '@/tests/fixtures/components/shared/static/TeamMocks';

describe('TeamMemberCard', () => {
  test('given team member then name is rendered', () => {
    // Given / When
    render(<TeamMemberCard member={TEST_TEAM_MEMBER} />);

    // Then
    expect(screen.getByText(TEST_TEAM_MEMBER.name)).toBeInTheDocument();
  });

  test('given team member then bio is rendered', () => {
    // Given / When
    render(<TeamMemberCard member={TEST_TEAM_MEMBER} />);

    // Then
    expect(screen.getByText(TEST_TEAM_MEMBER.bio, { exact: false })).toBeInTheDocument();
  });

  test('given team member then image is rendered', () => {
    // Given / When
    render(<TeamMemberCard member={TEST_TEAM_MEMBER} />);

    // Then
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', TEST_TEAM_MEMBER.image);
  });

  test('given team member without image then component renders without error', () => {
    // Given / When
    const { container } = render(<TeamMemberCard member={TEST_TEAM_MEMBER_NO_IMAGE} />);

    // Then
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText(TEST_TEAM_MEMBER_NO_IMAGE.name)).toBeInTheDocument();
  });

  test('given light variant then component renders without error', () => {
    // Given / When
    const { container } = render(<TeamMemberCard member={TEST_TEAM_MEMBER} variant="light" />);

    // Then
    expect(container.firstChild).toBeInTheDocument();
  });

  test('given dark variant then component renders without error', () => {
    // Given / When
    const { container } = render(<TeamMemberCard member={TEST_TEAM_MEMBER} variant="dark" />);

    // Then
    expect(container.firstChild).toBeInTheDocument();
  });
});

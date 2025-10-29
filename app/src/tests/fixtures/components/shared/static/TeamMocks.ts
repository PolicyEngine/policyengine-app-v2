import { TeamMember } from '@/components/shared/static/TeamMemberCard';

export const TEST_TEAM_MEMBER: TeamMember = {
  name: 'Test Member',
  bio: 'is a test team member with sample bio text for testing purposes.',
  image: '/assets/team/test-member.png',
};

export const TEST_TEAM_MEMBER_NO_IMAGE: TeamMember = {
  name: 'Another Member',
  bio: 'works on important projects.',
  image: '/assets/team/another-member.png',
};

export const TEST_TEAM_MEMBERS: TeamMember[] = [TEST_TEAM_MEMBER, TEST_TEAM_MEMBER_NO_IMAGE];

import { cn } from '@/lib/utils';

export interface TeamMember {
  name: string;
  bio: string;
  image: string;
}

export interface TeamMemberCardProps {
  member: TeamMember;
  variant?: 'default' | 'inverted';
}

export default function TeamMemberCard({ member, variant = 'default' }: TeamMemberCardProps) {
  const isInverted = variant === 'inverted';

  return (
    <div className="tw:grid tw:grid-cols-1 sm:tw:grid-cols-[auto_1fr] tw:items-stretch tw:gap-[5vw] tw:mt-[50px]">
      <img
        src={member.image}
        alt={member.name}
        className="tw:h-[180px] tw:w-[180px] sm:tw:h-[250px] sm:tw:w-[250px] tw:object-cover tw:rounded-container"
      />

      <div
        className={cn(
          'tw:h-full tw:pb-[50px] tw:border-b',
          isInverted ? 'tw:border-white' : 'tw:border-black'
        )}
      >
        <p
          className={cn(
            'tw:text-base tw:leading-relaxed',
            isInverted ? 'tw:text-text-inverse' : 'tw:text-text-primary'
          )}
        >
          <span className="tw:font-semibold tw:uppercase tw:tracking-wide">{member.name}</span>{' '}
          {member.bio}
        </p>
      </div>
    </div>
  );
}

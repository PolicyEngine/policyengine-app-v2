import SupportedProject, { SupportedProject as SupportedProjectType } from './SupportedProject';

export interface Supporter {
  id: string;
  name: string;
  websiteUrl?: string;
  logoUrl?: string;
  description: string;
}

export interface SupporterCardProps {
  supporter: Supporter;
  projects: SupportedProjectType[];
}

export default function SupporterCard({ supporter, projects }: SupporterCardProps) {
  return (
    <div className="tw:mb-4xl tw:p-2xl tw:border tw:border-border-light tw:rounded-element tw:shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-lg tw:mb-2xl">
        {supporter.logoUrl && (
          <a
            href={supporter.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw:shrink-0"
          >
            <img
              src={supporter.logoUrl}
              alt={`${supporter.name} logo`}
              className="tw:w-[150px] tw:sm:w-[200px] tw:h-[60px] tw:sm:h-[80px] tw:object-contain tw:object-left-center"
            />
          </a>
        )}
        <p className="tw:text-base tw:leading-relaxed">
          {supporter.websiteUrl ? (
            <a
              href={supporter.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:text-blue-700 tw:font-bold tw:no-underline tw:hover:underline"
            >
              {supporter.name}
            </a>
          ) : (
            <span className="tw:font-bold">{supporter.name}</span>
          )}{' '}
          &mdash; {supporter.description}
        </p>
      </div>

      {projects.map((project, index) => (
        <SupportedProject key={index} project={project} />
      ))}
    </div>
  );
}

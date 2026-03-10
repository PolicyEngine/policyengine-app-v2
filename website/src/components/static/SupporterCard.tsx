import SupportedProject, { SupportedProjectData } from "./SupportedProject";
import { colors } from "@policyengine/design-system/tokens";

export interface Supporter {
  id: string;
  name: string;
  websiteUrl?: string;
  logoUrl?: string;
  description: string;
}

export interface SupporterCardProps {
  supporter: Supporter;
  projects: SupportedProjectData[];
}

export default function SupporterCard({
  supporter,
  projects,
}: SupporterCardProps) {
  return (
    <div
      style={{
        marginBottom: "48px",
        padding: "24px",
        border: `1px solid ${colors.border.light}`,
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {supporter.logoUrl && (
          <a
            href={supporter.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flexShrink: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={supporter.logoUrl}
              alt={`${supporter.name} logo`}
              width={200}
              height={80}
              loading="lazy"
              style={{
                width: 200,
                height: 80,
                objectFit: "contain",
                objectPosition: "left center",
              }}
            />
          </a>
        )}
        <p style={{ fontSize: "16px", lineHeight: 1.625, margin: 0 }}>
          {supporter.websiteUrl ? (
            <a
              href={supporter.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: colors.blue[700],
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {supporter.name}
            </a>
          ) : (
            <span style={{ fontWeight: 700 }}>{supporter.name}</span>
          )}{" "}
          &mdash; {supporter.description}
        </p>
      </div>

      {projects.map((project, index) => (
        <SupportedProject key={index} project={project} />
      ))}
    </div>
  );
}

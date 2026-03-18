import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

export interface SupportedProjectData {
  title: string;
  projectUrl?: string;
  amount: number;
  currency: "USD" | "GBP";
  awardDate: string;
  description: string;
  supporterId: string;
}

function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function SupportedProject({
  project,
}: {
  project: SupportedProjectData;
}) {
  return (
    <div
      style={{
        margin: "16px 0",
        padding: "16px",
        borderLeft: `4px solid ${colors.primary[500]}`,
        backgroundColor: colors.gray[50],
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: spacing.sm,
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          fontFamily: typography.fontFamily.primary,
        }}
      >
        {project.projectUrl ? (
          <a
            href={project.projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: colors.blue[700],
              textDecoration: "none",
            }}
          >
            {project.title}
          </a>
        ) : (
          project.title
        )}
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: spacing.lg,
          marginBottom: spacing.sm,
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.body,
          }}
        >
          <strong>Award:</strong> {project.currency === "GBP" ? "£" : "$"}
          {project.amount.toLocaleString("en-US")}
        </span>
        <span
          style={{
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.body,
          }}
        >
          <strong>Date:</strong> {formatDate(project.awardDate)}
        </span>
      </div>

      <p
        style={{
          fontSize: typography.fontSize.base,
          fontFamily: typography.fontFamily.body,
          lineHeight: typography.lineHeight.relaxed,
          margin: 0,
        }}
      >
        {project.description}
      </p>
    </div>
  );
}

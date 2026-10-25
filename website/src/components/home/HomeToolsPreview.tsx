import Link from "next/link";
import {
  IconApps,
  IconChartDots,
  IconStairsDown,
  type TablerIcon,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { colors, spacing, typography } from "@/designTokens";
import {
  getAllToolsHref,
  getFeaturedTools,
  type FeaturedTool,
} from "@/lib/featuredTools";

/** The tracker gets the large card; the other featured tools get small ones. */
const TRACKER_SLUG = "bill-tracker";

const TOOL_ICONS: Record<string, TablerIcon> = {
  cliffwatch: IconStairsDown,
  "obbba-households": IconChartDots,
};

const cardClassName = cn(
  "tw:block tw:h-full tw:no-underline tw:text-inherit tw:group",
  "tw:rounded-feature tw:overflow-hidden tw:bg-white tw:border tw:border-border-light",
  "tw:transition-all tw:duration-300 tw:ease-out",
  "tw:hover:shadow-[0_8px_30px_rgba(16,24,40,0.1)] tw:hover:-translate-y-0.5",
  "tw:focus-visible:shadow-[0_0_0_2px_var(--color-primary-500)] tw:focus-visible:outline-none",
);

// Tools are separate zones served through rewrites, so their cards are plain
// <a> elements: a client-side transition can't reach another zone.
function ToolCard({ tool }: { tool: FeaturedTool }) {
  const ToolIcon = TOOL_ICONS[tool.slug] ?? IconApps;

  return (
    <a href={tool.href} className={cardClassName}>
      <div className="tw:flex tw:flex-col tw:h-full tw:p-3xl">
        <div className="tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-container tw:bg-primary-50 tw:mb-lg">
          <ToolIcon size={22} color={colors.primary[600]} aria-hidden="true" />
        </div>
        <p className="tw:text-xs tw:font-semibold tw:text-primary-600 tw:uppercase tw:tracking-[0.06em] tw:mb-sm">
          Interactive tool
        </p>
        <p className="tw:text-xl tw:font-bold tw:leading-tight tw:text-gray-900 tw:mb-md">
          {tool.label}
        </p>
        <p className="tw:text-sm tw:text-text-secondary tw:leading-relaxed tw:flex-1">
          {tool.description}
        </p>
        <p className="tw:text-sm tw:font-semibold tw:text-primary-600 tw:mt-lg tw:transition-transform tw:duration-200 tw:group-hover:translate-x-1">
          Open &rarr;
        </p>
      </div>
    </a>
  );
}

export default function HomeToolsPreview({ countryId }: { countryId: string }) {
  if (countryId !== "us") return null;

  const featuredTools = getFeaturedTools(countryId);
  const tracker = featuredTools.find((tool) => tool.slug === TRACKER_SLUG);
  const tools = featuredTools.filter((tool) => tool.slug !== TRACKER_SLUG);

  return (
    <div
      style={{
        backgroundColor: colors.primary[50],
        paddingTop: spacing["5xl"],
        paddingBottom: spacing["5xl"],
      }}
    >
      <div
        style={{
          maxWidth: spacing.layout.content,
          margin: "0 auto",
          padding: `0 ${spacing.xl}`,
        }}
      >
        {/* Section header */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: spacing.md,
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: spacing["3xl"],
          }}
        >
          <p
            style={{
              fontWeight: typography.fontWeight.bold,
              fontSize: typography.fontSize["3xl"],
              color: colors.primary[800],
              fontFamily: typography.fontFamily.primary,
              lineHeight: typography.lineHeight.tight,
              margin: 0,
            }}
          >
            Interactive tools
          </p>
          <Link
            href={getAllToolsHref(countryId)}
            style={{
              textDecoration: "none",
              color: colors.primary[600],
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            View all tools &rarr;
          </Link>
        </div>

        {/* Tracker card */}
        {tracker && (
          <a href={tracker.href} className={cardClassName}>
            <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2">
              {/* Left: Image */}
              <div className="tw:relative tw:overflow-hidden tw:min-h-[200px] tw:sm:min-h-[280px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/posts/state-legislative-tracker.webp"
                  alt="2026 State legislative tracker showing US map with state session statuses"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                />
              </div>

              {/* Right: Content */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: spacing["3xl"],
                }}
              >
                <p
                  style={{
                    color: colors.primary[600],
                    fontWeight: typography.fontWeight.semibold,
                    fontSize: typography.fontSize.xs,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: typography.fontFamily.primary,
                    marginBottom: spacing.sm,
                  }}
                >
                  Interactive tool
                </p>
                <p
                  style={{
                    fontWeight: typography.fontWeight.bold,
                    fontSize: typography.fontSize["2xl"],
                    lineHeight: typography.lineHeight.tight,
                    fontFamily: typography.fontFamily.primary,
                    color: colors.gray[900],
                    marginBottom: spacing.md,
                  }}
                >
                  2026 State legislative tracker
                </p>
                <p
                  style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.secondary,
                    lineHeight: typography.lineHeight.relaxed,
                    fontFamily: typography.fontFamily.primary,
                    marginBottom: spacing.lg,
                  }}
                >
                  {tracker.description}
                </p>
                <p
                  style={{
                    fontWeight: typography.fontWeight.semibold,
                    fontSize: typography.fontSize.sm,
                    color: colors.primary[600],
                    fontFamily: typography.fontFamily.primary,
                  }}
                >
                  Explore the tracker &rarr;
                </p>
              </div>
            </div>
          </a>
        )}

        {/* Other tools */}
        {tools.length > 0 && (
          <div
            className={cn(
              "tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-2xl",
              tracker && "tw:mt-2xl",
            )}
          >
            {tools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

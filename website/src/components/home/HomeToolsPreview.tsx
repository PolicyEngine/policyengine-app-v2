import {
  IconAdjustmentsHorizontal,
  IconApps,
  IconBriefcase,
  IconCash,
  IconCompass,
  IconFriends,
  IconHeartHandshake,
  IconHomeDollar,
  IconSchool,
  IconStairsDown,
  type TablerIcon,
} from "@tabler/icons-react";
import { colors, spacing } from "@/designTokens";
import { getToolsMenu, MAIN_APP_ID, type ToolLink } from "@/lib/toolsMenu";
import { homeCardClassName } from "./homeCardClassName";
import HomeSectionHeading from "./HomeSectionHeading";

const TOOL_ICONS: Record<string, TablerIcon> = {
  [MAIN_APP_ID]: IconAdjustmentsHorizontal,
  cliffwatch: IconStairsDown,
  "uk-cliff-watch": IconStairsDown,
  "coverage-compass": IconCompass,
  givecalc: IconHeartHandshake,
  marriage: IconFriends,
  "qbi-calculator": IconBriefcase,
  "spm-calculator": IconHomeDollar,
  "tanf-calculator": IconCash,
  "uk-student-loan-calculator": IconSchool,
};

// The main app is on another domain and each tool is a separate zone, so the
// cards are plain <a> elements: a client-side transition can't reach either.
function ToolCard({ tool }: { tool: ToolLink }) {
  const ToolIcon = TOOL_ICONS[tool.id] ?? IconApps;

  return (
    <a href={tool.href} className={homeCardClassName}>
      <div className="tw:flex tw:flex-col tw:h-full tw:p-2xl">
        <div className="tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-container tw:bg-primary-50 tw:mb-lg">
          <ToolIcon size={22} color={colors.primary[600]} aria-hidden="true" />
        </div>
        <p className="tw:text-lg tw:font-bold tw:leading-tight tw:text-gray-900 tw:mb-sm">
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

/** The Tools menu's entries as cards: the main app, then the tools. */
export default function HomeToolsPreview({ countryId }: { countryId: string }) {
  const tools = getToolsMenu(countryId);
  if (tools.length === 0) return null;

  return (
    <section
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
        <HomeSectionHeading title="Tools" />
        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-4 tw:gap-xl">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}

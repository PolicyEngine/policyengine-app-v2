import type { CountryId } from "@/lib/countries";

export type ToolCategory =
  | "Policy calculators"
  | "Developer tools"
  | "Emulators and analysis tools";

export type ToolTone = "teal" | "slate" | "amber" | "rose" | "sky";

export type ToolPreview =
  | {
      type: "terminal";
      lines: Array<{
        kind: "comment" | "command" | "prompt" | "output" | "success";
        text: string;
      }>;
    }
  | {
      type: "metrics";
      eyebrow: string;
      items: Array<{ label: string; value: string }>;
    }
  | {
      type: "image";
      src: string;
      alt: string;
      badge?: string;
      objectPosition?: string;
    };

export interface ToolAction {
  label: string;
  href: string;
  external?: boolean;
}

export interface ToolDefinition {
  slug: string;
  title: string;
  summary: string;
  category: ToolCategory;
  countryIds: Array<CountryId | "all">;
  primaryAction: ToolAction;
  tone: ToolTone;
  preview: ToolPreview;
  priority: number;
}

export const CATEGORY_DESCRIPTIONS: Record<
  ToolCategory,
  { label: string; description: string }
> = {
  "Policy calculators": {
    label: "Estimate household and policy impacts quickly.",
    description:
      "Public-facing tools that turn complicated tax and benefit rules into usable calculators.",
  },
  "Developer tools": {
    label: "Build analysis faster.",
    description:
      "Tools for analysts and engineers who need direct access to PolicyEngine-powered workflows.",
  },
  "Emulators and analysis tools": {
    label: "Compare methods and stress-test assumptions.",
    description:
      "Tools designed for technical analysis, policy comparison, and deeper model exploration.",
  },
};

const toolDefinitions: ToolDefinition[] = [
  {
    slug: "claude-plugin",
    title: "Claude plugin",
    summary:
      "Run microsimulations, model reforms, and generate analysis directly from your terminal.",
    category: "Developer tools",
    countryIds: ["us", "uk"],
    primaryAction: {
      label: "Open tool",
      href: "/{countryId}/claude-plugin",
    },
    tone: "slate",
    preview: {
      type: "terminal",
      lines: [
        { kind: "comment", text: "# Ask a policy question" },
        {
          kind: "prompt",
          text: "Estimate the impact of expanding the Child Tax Credit",
        },
        { kind: "output", text: "Running microsimulation on household microdata..." },
        { kind: "success", text: "Impact summary ready with distributional results" },
      ],
    },
    priority: 10,
  },
  {
    slug: "taxsim",
    title: "Taxsim emulator",
    summary:
      "Explore TAXSIM-style tax calculations in a more modern PolicyEngine interface.",
    category: "Emulators and analysis tools",
    countryIds: ["us"],
    primaryAction: {
      label: "Open tool",
      href: "/us/taxsim",
    },
    tone: "sky",
    preview: {
      type: "metrics",
      eyebrow: "Compare inputs and outputs",
      items: [
        { label: "Federal tax", value: "$11,420" },
        { label: "Payroll tax", value: "$6,885" },
        { label: "Effective rate", value: "18.6%" },
      ],
    },
    priority: 9,
  },
  {
    slug: "keep-your-pay-act",
    title: "Keep Your Pay Act calculator",
    summary:
      "Estimate how Senator Booker's proposal changes taxes, credits, and net income.",
    category: "Policy calculators",
    countryIds: ["us"],
    primaryAction: {
      label: "Open tool",
      href: "/us/keep-your-pay-act",
    },
    tone: "amber",
    preview: {
      type: "image",
      src: "/assets/posts/keep-your-pay-act-calculator.png",
      alt: "Keep Your Pay Act calculator interface",
      objectPosition: "center top",
    },
    priority: 8,
  },
  {
    slug: "tanf-calculator",
    title: "TANF calculator",
    summary:
      "Check TANF eligibility and benefit amounts across all 50 states and DC.",
    category: "Policy calculators",
    countryIds: ["us"],
    primaryAction: {
      label: "Open tool",
      href: "https://policyengine.github.io/tanf-calculator/",
      external: true,
    },
    tone: "teal",
    preview: {
      type: "image",
      src: "/assets/posts/tanf-calculator.png",
      alt: "TANF calculator interface",
      objectPosition: "center top",
    },
    priority: 7,
  },
  {
    slug: "marriage-calculator",
    title: "Marriage incentive calculator",
    summary:
      "See how marriage changes taxes, benefits, and take-home income for a household.",
    category: "Policy calculators",
    countryIds: ["us", "uk"],
    primaryAction: {
      label: "Open tool",
      href: "https://marriage-zeta-beryl.vercel.app/",
      external: true,
    },
    tone: "rose",
    preview: {
      type: "image",
      src: "/assets/posts/marriage-calculator.webp",
      alt: "Marriage incentive calculator charts and controls",
      objectPosition: "center top",
    },
    priority: 6,
  },
  {
    slug: "uk-student-loan-calculator",
    title: "Student loan deductions calculator",
    summary:
      "Analyse repayments, marginal tax rates, and take-home pay for UK graduates.",
    category: "Policy calculators",
    countryIds: ["uk"],
    primaryAction: {
      label: "Open tool",
      href: "https://uk-student-loan-calculator.vercel.app/",
      external: true,
    },
    tone: "sky",
    preview: {
      type: "image",
      src: "/assets/posts/uk-student-loan-calculator.webp",
      alt: "Student loan deductions calculator charts",
      objectPosition: "center top",
    },
    priority: 8,
  },
  {
    slug: "uk-salary-sacrifice-tool",
    title: "Salary sacrifice cap analysis tool",
    summary:
      "Test how caps on NI-exempt pension salary sacrifice affect revenue and households.",
    category: "Emulators and analysis tools",
    countryIds: ["uk"],
    primaryAction: {
      label: "Open tool",
      href: "https://policyengine.github.io/uk-salary-sacrifice-analysis/",
      external: true,
    },
    tone: "teal",
    preview: {
      type: "metrics",
      eyebrow: "Test policy options",
      items: [
        { label: "Revenue", value: "GBP1.4B" },
        { label: "Affected workers", value: "2.1M" },
        { label: "Median change", value: "-GBP86" },
      ],
    },
    priority: 7,
  },
  {
    slug: "local-areas-dashboard",
    title: "UK local areas dashboard",
    summary:
      "Explore how national policies affect constituencies and local authorities across the UK.",
    category: "Emulators and analysis tools",
    countryIds: ["uk"],
    primaryAction: {
      label: "Open tool",
      href: "https://local-area.vercel.app/",
      external: true,
    },
    tone: "amber",
    preview: {
      type: "metrics",
      eyebrow: "Zoom in geographically",
      items: [
        { label: "Coverage", value: "650 seats" },
        { label: "Local areas", value: "370+" },
        { label: "Views", value: "Map + tables" },
      ],
    },
    priority: 6,
  },
];

function resolveActionHref(href: string, countryId: string) {
  return href.replaceAll("{countryId}", countryId);
}

export function getToolsForCountry(countryId: string): ToolDefinition[] {
  return toolDefinitions
    .filter((tool) =>
      tool.countryIds.includes("all") ||
      tool.countryIds.includes(countryId as CountryId),
    )
    .map((tool) => ({
      ...tool,
      primaryAction: {
        ...tool.primaryAction,
        href: resolveActionHref(tool.primaryAction.href, countryId),
      },
    }))
    .sort((left, right) => right.priority - left.priority);
}

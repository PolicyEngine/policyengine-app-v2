"use client";

import Link from "next/link";
import ContentSection from "@/components/static/ContentSection";
import { Button } from "@/components/ui";
import { colors, typography } from "@policyengine/design-system/tokens";

interface AIContentProps {
  countryId: string;
}

export default function AIContent({ countryId }: AIContentProps) {
  const isUK = countryId === "uk";
  const democratize = isUK ? "democratise" : "democratize";
  const optimized = isUK ? "optimised" : "optimized";
  const recognized = isUK ? "recognised" : "recognized";

  return (
    <>
      {/* Hero banner */}
      <ContentSection>
        <div className="tw:max-w-3xl">
          <h2
            className="tw:text-2xl tw:md:text-3xl tw:font-semibold tw:mb-4"
            style={{
              fontFamily: typography.fontFamily.primary,
              color: colors.text.primary,
            }}
          >
            AI grounded in real microsimulation
          </h2>
          <p
            className="tw:text-base tw:md:text-lg tw:leading-relaxed tw:mb-6"
            style={{ color: colors.gray[600] }}
          >
            PolicyEngine combines tax-benefit microsimulation with large
            language models to {democratize} policy understanding. Every answer
            our AI tools give is backed by a real simulation — never fabricated,
            never guessed.
          </p>
          <div className="tw:flex tw:flex-col tw:sm:flex-row tw:gap-3">
            <a
              href="https://policyengine-uk-chat.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="default" size="lg">
                Try PolicyEngine UK chat
              </Button>
            </a>
            <Link href={`/${countryId}/research`}>
              <Button variant="outline" size="lg">
                Read our research
              </Button>
            </Link>
          </div>
        </div>
      </ContentSection>

      {/* User-facing tools */}
      <ContentSection title="Try our AI tools" variant="secondary">
        <p
          className="tw:text-base tw:leading-relaxed tw:mb-8 tw:max-w-3xl"
          style={{ color: colors.gray[600] }}
        >
          Open chat assistants and benchmarks you can use today.
        </p>
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
          {tools.map((tool) => (
            <a
              key={tool.title}
              href={tool.href}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:rounded-lg tw:p-6 tw:shadow-sm tw:transition-transform tw:duration-300 tw:hover:-translate-y-1 tw:no-underline tw:block"
              style={{ backgroundColor: colors.white }}
            >
              <div className="tw:flex tw:items-start tw:justify-between tw:mb-3">
                <h3
                  className="tw:text-lg tw:font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  {tool.title}
                </h3>
                {tool.badge && (
                  <span
                    className="tw:text-xs tw:font-medium tw:rounded-full tw:px-3 tw:py-1"
                    style={{
                      backgroundColor: colors.primary[50],
                      color: colors.primary[700],
                    }}
                  >
                    {tool.badge}
                  </span>
                )}
              </div>
              <p
                className="tw:text-sm tw:leading-relaxed tw:mb-4"
                style={{ color: colors.gray[600] }}
              >
                {tool.description}
              </p>
              <span
                className="tw:text-sm tw:font-medium"
                style={{ color: colors.primary[700] }}
              >
                Open →
              </span>
            </a>
          ))}
        </div>
      </ContentSection>

      {/* Four layers */}
      <ContentSection title="Four layers of AI work">
        <p
          className="tw:text-base tw:leading-relaxed tw:mb-8 tw:max-w-3xl"
          style={{ color: colors.gray[600] }}
        >
          We treat AI as infrastructure, not a feature. Our work spans four
          layers — from the chat experiences users see, to the data servers that
          let other AI assistants reason about policy.
        </p>
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
          {layers.map((layer, index) => (
            <div
              key={layer.title}
              className="tw:rounded-lg tw:p-6"
              style={{ backgroundColor: colors.gray[50] }}
            >
              <div
                className="tw:text-sm tw:font-semibold tw:mb-2"
                style={{ color: colors.primary[700] }}
              >
                Layer {index + 1}
              </div>
              <h3
                className="tw:text-lg tw:font-semibold tw:mb-2"
                style={{ color: colors.text.primary }}
              >
                {layer.title}
              </h3>
              <p
                className="tw:text-sm tw:leading-relaxed"
                style={{ color: colors.gray[600] }}
              >
                {layer.description}
              </p>
            </div>
          ))}
        </div>
      </ContentSection>

      {/* Timeline */}
      <ContentSection
        title="Built on five years of open AI research"
        variant="secondary"
      >
        <div
          className="tw:rounded-lg tw:p-6 tw:md:p-8 tw:max-w-4xl"
          style={{ backgroundColor: colors.white }}
        >
          {timeline.map((entry) => (
            <div
              key={entry.period}
              className="tw:mb-6 tw:last:mb-0 tw:pl-4"
              style={{ borderLeft: `2px solid ${colors.primary[500]}` }}
            >
              <div
                className="tw:text-sm tw:font-semibold tw:mb-1"
                style={{ color: colors.primary[700] }}
              >
                {entry.period}
              </div>
              <h3
                className="tw:text-base tw:font-semibold tw:mb-2"
                style={{ color: colors.text.primary }}
              >
                {entry.title}
              </h3>
              <p
                className="tw:text-sm tw:leading-relaxed"
                style={{ color: colors.gray[600] }}
              >
                {entry.description(optimized, recognized, democratize)}
              </p>
            </div>
          ))}
        </div>
      </ContentSection>

      {/* For developers */}
      <ContentSection title="For developers">
        <p
          className="tw:text-base tw:leading-relaxed tw:mb-8 tw:max-w-3xl"
          style={{ color: colors.gray[600] }}
        >
          Most of our AI work is open source. Use these to build your own
          policy-aware AI tools, or to give an existing AI assistant access to
          PolicyEngine.
        </p>
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
          {devResources.map((resource) => (
            <a
              key={resource.title}
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:rounded-lg tw:p-6 tw:shadow-sm tw:transition-transform tw:duration-300 tw:hover:-translate-y-1 tw:no-underline tw:block"
              style={{ backgroundColor: colors.gray[50] }}
            >
              <div
                className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:mb-2"
                style={{ color: colors.primary[700] }}
              >
                {resource.category}
              </div>
              <h3
                className="tw:text-base tw:font-semibold tw:mb-2"
                style={{ color: colors.text.primary }}
              >
                {resource.title}
              </h3>
              <p
                className="tw:text-sm tw:leading-relaxed tw:mb-3"
                style={{ color: colors.gray[600] }}
              >
                {resource.description}
              </p>
              <span
                className="tw:text-sm tw:font-medium"
                style={{ color: colors.primary[700] }}
              >
                View on GitHub →
              </span>
            </a>
          ))}
        </div>
      </ContentSection>

      {/* Demo video */}
      <ContentSection title="See it in action" variant="secondary">
        <div
          className="tw:rounded-lg tw:overflow-hidden tw:shadow-lg tw:max-w-4xl"
          style={{ backgroundColor: colors.gray[50] }}
        >
          <iframe
            src="https://www.youtube.com/embed/fnuDyLKpt90"
            width="100%"
            height="500"
            title="PolicyEngine AI demo"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            aria-label="Video demonstration of PolicyEngine AI features"
          />
        </div>
      </ContentSection>
    </>
  );
}

const tools = [
  {
    title: "PolicyEngine UK chat",
    badge: "Newest",
    description:
      "Ask any UK tax and benefit question in natural language. Runs the full PolicyEngine UK simulation engine in-process for fast, accurate answers grounded in real microdata.",
    href: "https://policyengine-uk-chat.vercel.app",
  },
  {
    title: "PolicyEngine chat",
    description:
      "Our original standalone chat assistant covering UK and US policy. Multi-country, with conversation history and shareable links.",
    href: "https://policyengine-chat.vercel.app",
  },
  {
    title: "PolicyBench",
    description:
      "A public benchmark for evaluating how well large language models reason about tax and benefit policy questions.",
    href: "https://policybench.vercel.app",
  },
  {
    title: "Atlas: policy library",
    description:
      "An open library of policy reforms with computed impacts. Browse what's been modelled and use it as a reference for AI-assisted research.",
    href: "https://policyengine.github.io/policy-library/",
  },
];

const layers = [
  {
    title: "User-facing chat",
    description:
      "Natural-language interfaces where anyone can ask a policy question and get an answer backed by a real simulation. PolicyEngine UK chat runs the compiled engine directly; earlier chat apps call our public API.",
  },
  {
    title: "AI narrative generation",
    description:
      "Turning numerical simulation results into plain-language explanations. We use Claude and GPT-4 to translate decile impacts, poverty rates, and budgetary effects into stories that anyone can read.",
  },
  {
    title: "Developer AI tooling",
    description:
      "Multi-agent systems that help us encode new programs faster, review pull requests, and maintain quality across our country models. Includes a GitHub bot powered by Claude Code and a shared Claude plugin.",
  },
  {
    title: "MCP servers",
    description:
      "Model Context Protocol servers expose PolicyEngine, DWP statistics, and the UK Data Service to any AI assistant. We make policy data first-class for the next generation of AI tools.",
  },
];

const timeline = [
  {
    period: "2021–2022",
    title: "Machine learning foundations",
    description: (optimized: string) =>
      `We pioneered the use of gradient descent to ${optimized} survey weights and match administrative totals, achieving up to 80% lower aggregate errors than other microsimulation models.`,
  },
  {
    period: "2023",
    title: "Enhanced microdata with quantile regression",
    description: () =>
      "Our Enhanced Current Population Survey integrated tax records with survey data using quantile regression forests — the first open alternative to restricted tax microdata for US policy microsimulation.",
  },
  {
    period: "March 2023",
    title: "GPT-4 narrative analysis",
    description: (_o: string, recognized: string, democratize: string) =>
      `When OpenAI released GPT-4, we ${recognized} its potential to ${democratize} policy understanding within a week. We launched an analysis tool that translates computational results into accessible narratives, with audience levels from ELI5 to expert.`,
  },
  {
    period: "2024",
    title: "Plain-language household explanations",
    description: () =>
      "We extended AI narratives to household-level calculations using Anthropic's Claude API, letting users understand exactly how their taxes and benefits are computed.",
  },
  {
    period: "2025",
    title: "MCP servers and agentic chat",
    description: () =>
      "We released MCP servers for PolicyEngine, DWP Stat-Xplore, and the UK Data Service. We launched standalone agentic chat apps and a GitHub bot that helps maintain our country models.",
  },
  {
    period: "April 2026",
    title: "PolicyEngine UK chat",
    description: () =>
      "Our most advanced AI tool yet. By running the compiled UK simulation engine in the same Modal container as the language model, we eliminated API round trips and unlocked structural reforms — letting users ask questions that change how policy is computed, not just its parameters.",
  },
];

const devResources = [
  {
    category: "MCP server",
    title: "policyengine-mcp",
    description:
      "Model Context Protocol server for the full PolicyEngine engine. Plug it into Claude, Cursor, or any MCP-compatible AI assistant.",
    href: "https://github.com/PolicyEngine/policyengine-mcp",
  },
  {
    category: "GitHub app",
    title: "policyengine-github-agent",
    description:
      "Claude Code-powered bot that reviews PRs, fixes issues, and answers questions on our country model repositories.",
    href: "https://github.com/PolicyEngine/policyengine-github-agent",
  },
  {
    category: "Claude Code plugin",
    title: "policyengine-claude",
    description:
      "Shared agents, skills, and slash commands for the PolicyEngine team. Open source — fork it for your own org.",
    href: "https://github.com/PolicyEngine/policyengine-claude",
  },
  {
    category: "MCP server",
    title: "stat-xplore-mcp",
    description:
      "MCP server exposing the UK Department for Work and Pensions' Stat-Xplore benefit statistics API.",
    href: "https://github.com/PolicyEngine/stat-xplore-mcp",
  },
];

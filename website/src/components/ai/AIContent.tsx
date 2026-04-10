"use client";

import Link from "next/link";
import Image from "next/image";
import ContentSection from "@/components/static/ContentSection";
import { Button } from "@/components/ui";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

interface AIContentProps {
  countryId: string;
}

export default function AIContent({ countryId }: AIContentProps) {
  const isUK = countryId === "uk";
  const democratize = isUK ? "democratise" : "democratize";
  const optimized = isUK ? "optimised" : "optimized";
  const recognized = isUK ? "recognised" : "recognized";

  const householdImage = isUK
    ? "/assets/images/ai/uk-household-ai.png"
    : "/assets/images/ai/us-household-ai.png";

  return (
    <>
      {/* Hero banner */}
      <ContentSection>
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-center tw:gap-8">
          <div className="tw:flex-1">
            <h2
              className="tw:text-2xl tw:md:text-3xl tw:font-semibold tw:mb-4"
              style={{
                fontFamily: typography.fontFamily.primary,
                color: colors.text.primary,
              }}
            >
              Making policy accessible with AI
            </h2>
            <p
              className="tw:text-base tw:md:text-lg tw:leading-relaxed tw:mb-6"
              style={{ color: colors.gray[600] }}
            >
              PolicyEngine combines tax-benefit microsimulation with
              cutting-edge AI to {democratize} policy understanding.
            </p>
            <Link href={`/${countryId}/research/us-household-ai`}>
              <Button variant="default" size="lg">
                Learn about our AI explanations tool
              </Button>
            </Link>
          </div>
          <div className="tw:flex-1 tw:flex tw:justify-center">
            <Image
              src={householdImage}
              alt="AI-powered household analysis"
              width={500}
              height={350}
              className="tw:rounded-lg tw:shadow-lg tw:max-w-full tw:h-auto"
            />
          </div>
        </div>
      </ContentSection>

      {/* Feature grid */}
      <ContentSection title="AI-powered policy analysis" variant="secondary">
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="tw:rounded-lg tw:p-6 tw:shadow-sm tw:transition-transform tw:duration-300 tw:hover:-translate-y-1"
              style={{ backgroundColor: colors.white }}
            >
              <div className="tw:text-3xl tw:mb-3">{feature.icon}</div>
              <h3
                className="tw:text-lg tw:font-semibold tw:mb-2"
                style={{ color: colors.text.primary }}
              >
                {feature.title}
              </h3>
              <p
                className="tw:text-sm tw:leading-relaxed"
                style={{ color: colors.gray[600] }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </ContentSection>

      {/* AI journey */}
      <ContentSection title="Our AI journey">
        <div
          className="tw:rounded-lg tw:p-6 tw:md:p-8"
          style={{ backgroundColor: colors.gray[50] }}
        >
          <h3
            className="tw:text-lg tw:font-semibold tw:mb-2"
            style={{ color: colors.primary[700] }}
          >
            Machine learning foundations: 2021-2022
          </h3>
          <p
            className="tw:text-sm tw:leading-relaxed tw:mb-4"
            style={{ color: colors.gray[600] }}
          >
            PolicyEngine has leveraged artificial intelligence since our
            inception. In 2021, we pioneered the use of machine learning to
            enhance our microsimulation models, applying gradient descent to{" "}
            {optimized} survey weights and match administrative totals with
            unprecedented accuracy.
          </p>
          <p
            className="tw:text-sm tw:leading-relaxed tw:mb-6"
            style={{ color: colors.gray[600] }}
          >
            By 2022, our UK model had achieved up to 80% lower aggregate errors
            compared to other microsimulation models. This foundation of
            AI-enhanced accuracy has been central to our mission of providing
            reliable policy analysis.
          </p>

          <h3
            className="tw:text-lg tw:font-semibold tw:mb-2"
            style={{ color: colors.primary[700] }}
          >
            Data science innovation: 2023
          </h3>
          <p
            className="tw:text-sm tw:leading-relaxed tw:mb-6"
            style={{ color: colors.gray[600] }}
          >
            We expanded our AI capabilities in 2023 with our Enhanced Current
            Population Survey (ECPS) for the US model, using quantile regression
            forests to integrate tax record information with survey data,
            creating the first open alternative to restricted tax microdata for
            policy microsimulation.
          </p>

          <h3
            className="tw:text-lg tw:font-semibold tw:mb-2"
            style={{ color: colors.primary[700] }}
          >
            AI-powered analysis: 2023-present
          </h3>
          <p
            className="tw:text-sm tw:leading-relaxed tw:mb-4"
            style={{ color: colors.gray[600] }}
          >
            When OpenAI released GPT-4 in March 2023, we immediately{" "}
            {recognized} its potential to {democratize} policy understanding.
            Within just one month, we launched our AI-powered analysis tool that
            translates complex computational results into accessible narratives.
          </p>
          <p
            className="tw:text-sm tw:leading-relaxed"
            style={{ color: colors.gray[600] }}
          >
            In 2024, we extended this capability to household-level calculations
            with Anthropic&apos;s Claude API, enabling users to understand
            exactly how their taxes and benefits are calculated through
            plain-language explanations.
          </p>
        </div>
      </ContentSection>

      {/* How it works */}
      <ContentSection title="How it works" variant="secondary">
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-center tw:gap-8">
          <div className="tw:flex-1">
            <p
              className="tw:text-sm tw:leading-relaxed tw:mb-4"
              style={{ color: colors.gray[600] }}
            >
              PolicyEngine integrates large language models with our
              computational tax-benefit engine to transform complex calculations
              into clear explanations.
            </p>
            <p
              className="tw:text-sm tw:leading-relaxed tw:mb-4"
              style={{ color: colors.gray[600] }}
            >
              For household calculations, we process thousands of intermediate
              values across tax and benefit programs, then use Anthropic&apos;s
              Claude API to generate plain-language explanations of eligibility,
              amounts, and potential changes.
            </p>
            <p
              className="tw:text-sm tw:leading-relaxed"
              style={{ color: colors.gray[600] }}
            >
              For policy analysis, we leverage GPT-4 to weave narratives from
              our computational results, explaining reforms in terms anyone can
              understand — from simplified &quot;ELI5&quot; explanations to
              detailed technical analyses for policy experts.
            </p>
          </div>
          <div className="tw:flex-1 tw:flex tw:justify-center">
            <Image
              src="/assets/images/ai/ai-analysis.png"
              alt="AI-powered analysis architecture"
              width={500}
              height={350}
              className="tw:rounded-lg tw:shadow-lg tw:max-w-full tw:h-auto"
            />
          </div>
        </div>
      </ContentSection>

      {/* Demo video */}
      <ContentSection title="Watch our AI demo">
        <div className="tw:rounded-lg tw:overflow-hidden tw:shadow-lg">
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

const features = [
  {
    icon: "✨",
    title: "Instant analysis",
    description:
      "Generate comprehensive policy analysis with natural language, tailored to different knowledge levels.",
  },
  {
    icon: "🧠",
    title: "Plain language explanations",
    description:
      "Understand complex tax and benefit calculations through clear, accessible explanations of your household's finances.",
  },
  {
    icon: "📊",
    title: "Data-driven insights",
    description:
      "Combine computational precision with narrative insights to tell the complete story of policy impacts.",
  },
];

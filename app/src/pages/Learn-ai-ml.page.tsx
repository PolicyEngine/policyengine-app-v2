import React from 'react';
import aiAnalysisImg from '@/assets/ai-analysis.png';
import usHouseholdAiImg from '@/assets/us-household-ai.png';
import CalloutWithImage from '@/components/shared/static/CalloutWithImage';
import { CardsWithHeader } from '@/components/shared/static/CardsWithHeader';
import PageHeader from '@/components/shared/static/PageHeader';
import { TitleCardWithHeader } from '@/components/shared/static/TextCardWithHeader';
import TwoColumnView from '@/components/TwoColumnView';

export default function HomePage() {
  const leftColumnContent = (
    <>
      PolicyEngine integrates large language models with our computational tax-benefit engine to
      transform complex calculations into clear explanations.
      <br />
      <br />
      For household calculations, we process thousands of intermediate values across tax and benefit
      programs, then use Anthropic's Claude API to generate plain-language explanations of
      eligibility, amounts, and potential changes.
      <br />
      <br />
      For policy analysis, we leverage GPT-4 to weave narratives from our computational results,
      explaining reforms in terms anyone can understand - from simplified `ELI5` explanations to
      detailed technical analyses for policy experts.
    </>
  );

  const rightColumnContent = (
    <img
      src={aiAnalysisImg}
      alt="Diagram illustrating AI analysis"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );

  return (
    <>
      <PageHeader
        title="AI & Machine Learning"
        description="PolicyEngine uses artificial intelligence and machine learning to make policy analysis more accurate and accessible."
      />
      <CalloutWithImage
        title="Making Policy Accessible With AI"
        description="PolicyEngine combines tax-benefit microsimulation with cutting-edge AI to democratize policy understanding"
        buttonLabel="Learn about our AI explanations tool"
        onButtonClick={() => console.log('clicked')}
        imageSrc={usHouseholdAiImg}
        imageAlt="AI Explanations Tool Preview"
      />
      <CardsWithHeader
        containerTitle="AI/ML Resources"
        cards={[
          {
            title: 'Instant analysis',
            description:
              'Generate comprehensive policy analysis with natural language, tailored to different knowledge levels',
            icon: '✨',
            background: 'gray',
          },
          {
            title: 'Plain language explanations',
            description:
              "Understand complex tax and benefit calculations through clear, accessible explanations of your household's finances",
            icon: '🧠',
            background: 'gray',
          },
          {
            title: 'Data-driven insights',
            description:
              'Combine computational precision with narrative insights to tell the complete story of policy impacts',
            icon: '📊',
            background: 'gray',
          },
        ]}
      />

      <TitleCardWithHeader
        title="Our AI Journey"
        sections={[
          {
            heading: 'Machine learning foundations: 2021-2022',
            body: 'PolicyEngine has leveraged artificial intelligence since our inception. In 2021, we pioneered the use of machine learning to enhance our microsimulation models, applying gradient descent to optimized survey weights and match administrative totals with unprecedented accuracy.',
          },
          {
            body: 'By 2022, our UK model had achieved up to 80% lower aggregate errors compared to other microsimulation models. This foundation of AI-enhanced accuracy has been central to our mission of providing reliable policy analysis.',
          },
          {
            heading: 'Data science innovation: 2023',
            body: 'We expanded our AI capabilities in 2023 with our Enhanced Current Population Survey (ECPS) for the US model, using quantile regression forests to integrate tax record information with survey data, creating the first open alternative to restricted tax microdata for policy microsimulation.',
          },
          {
            heading: 'AI-Powered Analysis: 2023-Present',
            body: 'When OpenAI released GPT-4 in March 2023, we immediately recognized its potential to democratize policy understanding. Within just one month, we launched our AI-powered Analysis tool that translates complex computational results into accessible narratives.',
          },
          {
            body: "In 2024, we extended this capability to household-level calculations with Anthropic's Claude API, enabling users to understand exactly how their taxes and benefits are calculated through plain-language explanations.",
          },
        ]}
        backgroundColor="gray"
      />

      <TwoColumnView
        title="How it works"
        leftColumn={leftColumnContent}
        rightColumn={rightColumnContent}
      />

      <h1>Watch our AI Demo</h1>
      <iframe
        width="900"
        height="550"
        src="https://www.youtube.com/embed/fnuDyLKpt90?si=kIOaT5HbJzRRV0Fj"
        title="YouTube video player"
        style={{ border: 'none' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </>
  );
}

import React from 'react';
import CalloutWithImage from '@/components/shared/static/CalloutWithImage';
import { CardsWithHeader } from '@/components/shared/static/CardsWithHeader';
import PageHeader from '@/components/shared/static/PageHeader';
import aiAnalysisImg from '@/assets/ai-analysis.png';
import usHouseholdAiImg from '@/assets/us-household-ai.png';

export default function HomePage() {
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
                        description: 'Generate comprehensive policy analysis with natural language, tailored to different knowledge levels',
                        icon: '✨',
                        background: "white",
                    },
                    {
                        title: 'Plain language explanations',
                        description: "Understand complex tax and benefit calculations through clear, accessible explanations of your household's finances",
                        icon: '🧠',
                        background: 'white',
                    },
                    {
                        title: 'Data-driven insights',
                        description: "Combine computational precision with narrative insights to tell the complete story of policy impacts",
                        icon: '📊',
                        background: 'white',
                    },
                ]}
            />

            <CalloutWithImage
                title="How it works"
                description="PolicyEngine integrates large language models with our computational tax-benefit engine to transform complex calculations into clear explanations.\nFor household calculations, we process thousands of intermediate values across tax and benefit programs, then use Anthropic's Claude API to generate plain-language explanations of eligibility, amounts, and potential changes.\nFor policy analysis, we leverage GPT-4 to weave narratives from our computational results, explaining reforms in terms anyone can understand - from simplified `ELI5` explanations to detailed technical analyses for policy experts."
                imageSrc={aiAnalysisImg}
                imageAlt="AI Analysis Generation Modes"
            />

            <h1>Watch our AI Demo</h1>
            <iframe
                width="900"
                height="550"
                src="https://www.youtube.com/embed/fnuDyLKpt90?si=kIOaT5HbJzRRV0Fj"
                title="YouTube video player"
                style={{ border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />

        </>

    );
}
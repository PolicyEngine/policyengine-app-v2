import type { Metadata } from "next";
import HeroSection from "@/components/static/HeroSection";
import ContentSection from "@/components/static/ContentSection";
import CTASection from "@/components/static/CTASection";
import BulletList, { BulletItem } from "@/components/static/BulletList";
import RichTextBlock from "@/components/static/RichTextBlock";

export const metadata: Metadata = {
  title: "Donate",
};

const differenceItems: BulletItem[] = [
  {
    title: "Policy analysis",
    description:
      "Your donation funds policy simulations that help lawmakers understand the real-world impacts of their decisions.",
  },
  {
    title: "Benefit access",
    description:
      "We build tools that help people discover benefits they qualify for and navigate application processes.",
  },
  {
    title: "Open-source development",
    description:
      "All our code is public, letting researchers and developers worldwide build on our work.",
  },
  {
    title: "Global reach",
    description:
      "We operate in the US and UK, with plans to expand to more countries.",
  },
];

export default function DonatePage() {
  return (
    <>
      <HeroSection
        title="Donate"
        description="PolicyEngine is a nonprofit building free, open-source tools that help people understand tax and benefit policies. Your donation directly funds software development, research, and expansion to new countries."
      />

      <ContentSection
        title="The difference your support makes"
        variant="secondary"
      >
        <BulletList items={differenceItems} />
      </ContentSection>

      <CTASection
        title="How to donate"
        variant="accent"
        content={
          <RichTextBlock variant="inverted">
            <p>
              Donate securely through our fiscal sponsor, the PSL Foundation. We
              accept credit cards, bank transfers, and checks.
            </p>
            <p>
              Send checks to PolicyEngine, c/o PSL Foundation, 2108 Greene St.,
              PO Box 50932, Columbia, SC 29250, USA.
            </p>
            <p>Donations are tax-deductible in the US.</p>
          </RichTextBlock>
        }
        cta={{
          text: "Donate now",
          href: "https://opencollective.com/policyengine",
        }}
        caption="Donate via Open Collective"
      />
    </>
  );
}

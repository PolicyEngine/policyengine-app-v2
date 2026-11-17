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

function TaxNote({ countryId }: { countryId: string }) {
  if (countryId === "us") {
    return (
      <p>US taxpayers can deduct donations to the extent the law allows.</p>
    );
  }

  return (
    <p>
      The PSL Foundation, a US charity, receives donations in US dollars, and US
      taxpayers can deduct them to the extent US law allows.
      {countryId === "uk" && " Donations do not qualify for UK Gift Aid."}
    </p>
  );
}

export default async function DonatePage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;

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
              The PSL Foundation, a 501(c)(3) public charity (EIN 86-3092437),
              fiscally sponsors PolicyEngine and receives donations on our
              behalf. We accept credit cards, bank transfers, checks, and grants
              from donor-advised funds.
            </p>
            <p>
              Make checks payable to PSL Foundation, write
              &quot;PolicyEngine&quot; on the memo line, and mail them to
              PolicyEngine, c/o PSL Foundation, 2108 Greene St., PO Box 50932,
              Columbia, SC 29250, USA.
            </p>
            <p>
              To give from a donor-advised fund, recommend a grant to PSL
              Foundation (EIN 86-3092437) with &quot;PolicyEngine&quot; as its
              purpose or designation.
            </p>
            <p>
              For bank transfer instructions, email{" "}
              <a href="mailto:hello@policyengine.org">hello@policyengine.org</a>
              .
            </p>
            <TaxNote countryId={countryId} />
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

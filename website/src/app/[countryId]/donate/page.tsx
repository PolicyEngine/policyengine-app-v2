import type { Metadata } from "next";
import HeroSection from "@/components/static/HeroSection";
import ContentSection from "@/components/static/ContentSection";
import CTASection from "@/components/static/CTASection";
import BulletList, { BulletItem } from "@/components/static/BulletList";
import RichTextBlock from "@/components/static/RichTextBlock";

export const metadata: Metadata = {
  title: "Donate",
};

// PSL Foundation's EIN, from its IRS determination letter (psl-foundation.org/legal).
const PSL_EIN = "86-3092437";
const DONATE_EMAIL = "hello@policyengine.org";
const DONATE_MAILTO = `mailto:${DONATE_EMAIL}?subject=${encodeURIComponent(
  "Donation to PolicyEngine",
)}`;

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
              Our fiscal sponsor, PSL Foundation, receives donations for
              PolicyEngine. The IRS recognizes PSL Foundation as a 501(c)(3)
              public charity (EIN{" "}
              <span className="tw:whitespace-nowrap">{PSL_EIN}</span>), and
              gifts are tax-deductible in the US to the extent the law allows.
            </p>
            <p>
              To give by check, make it payable to PSL Foundation, write
              PolicyEngine on the memo line, and mail it to PolicyEngine, c/o
              PSL Foundation, 2108 Greene St., PO Box 50932, Columbia, SC 29250,
              USA.
            </p>
            <p>
              To give from a donor-advised fund, recommend a grant to PSL
              Foundation and name PolicyEngine as its purpose.
            </p>
            <p>
              For a bank transfer or another kind of gift, email us at{" "}
              <a href={DONATE_MAILTO}>{DONATE_EMAIL}</a> and we&apos;ll help you
              set it up.
            </p>
          </RichTextBlock>
        }
        cta={{
          text: "Email us to donate",
          href: DONATE_MAILTO,
        }}
        caption={DONATE_EMAIL}
      />
    </>
  );
}

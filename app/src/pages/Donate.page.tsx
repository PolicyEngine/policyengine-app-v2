import BulletList, { BulletItem } from '@/components/shared/static/BulletList';
import ContentSection from '@/components/shared/static/ContentSection';
import CTASection from '@/components/shared/static/CTASection';
import HeroSection from '@/components/shared/static/HeroSection';
import RichTextBlock from '@/components/shared/static/RichTextBlock';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';

const differenceItems: BulletItem[] = [
  {
    title: 'Comprehensive Policy Analysis:',
    description:
      'Funds enhance our ability to create robust policy simulations that align policymaking with societal goals.',
  },
  {
    title: 'Streamlined Benefit Access:',
    description:
      'Your support simplifies the process of determining eligibility, ensuring vital benefits reach those in need.',
  },
  {
    title: 'Open-Source Development:',
    description:
      'Contributions support a transparent, collaborative approach, amplifying the impact of each donation.',
  },
  {
    title: 'Global Impact:',
    description:
      'Donations fuel our work across the US and the UK, with plans to grow our policy tools globally.',
  },
];

export default function DonatePage() {
  return (
    <StaticPageLayout title="Donate">
      <HeroSection
        title="Donate"
        description="Your donation to PolicyEngine isn't just a gift — it's an investment in a transparent, open-source approach to public policy analysis and benefit access in the US and UK. By supporting our work, you're helping to extend the reach of our software, allowing a global community of contributors to continually enrich and expand its capabilities."
      />

      <ContentSection title="The difference your support makes" variant="secondary">
        <BulletList items={differenceItems} />
      </ContentSection>

      <CTASection
        title="How to Donate"
        variant="accent"
        content={
          <RichTextBlock variant="inverted">
            <p>
              Donate securely through our fiscal sponsor, the PSL Foundation. We accept credit card,
              bank transfer, or check. After contributing, please email{' '}
              <a href="mailto:hello@policyengine.org">hello@policyengine.org</a> to ensure we route
              and acknowledge your gift.
            </p>
            <p>
              Send checks to PolicyEngine, c/o PSL Foundation, 2108 Greene St., PO Box 50932,
              Columbia, SC 29250, USA.
            </p>
            <p>Donations are tax-deductible in the US.</p>
          </RichTextBlock>
        }
        cta={{
          text: 'Support Transparent\nPolicy Access',
          href: 'https://opencollective.com/policyengine',
          multiline: true,
        }}
        caption="Donate on Open Collective through our fiscal sponsor, the PSL Foundation"
      />
    </StaticPageLayout>
  );
}

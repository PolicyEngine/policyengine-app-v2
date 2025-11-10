import ContentSection from '@/components/shared/static/ContentSection';
import HeroSection from '@/components/shared/static/HeroSection';
import RichTextBlock from '@/components/shared/static/RichTextBlock';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';

export default function EducationPage() {
  return (
    <StaticPageLayout title="Educational use">
      <HeroSection
        title="Coming soon"
        description="We're currently developing comprehensive content about how PolicyEngine can be used in educational settings. This page will include:"
      />

      <ContentSection variant="secondary">
        <RichTextBlock>
          <ul>
            <li>Classroom guides for teaching tax and benefit policies</li>
            <li>University case studies of PolicyEngine in research and teaching</li>
            <li>Educational resources for various learning levels</li>
            <li>Integration with educational curricula</li>
            <li>Workshop materials and lesson plans</li>
          </ul>
        </RichTextBlock>
      </ContentSection>

      <ContentSection>
        <RichTextBlock>
          <p>
            If you're using PolicyEngine in an educational setting and would like to contribute your
            story or resources, please contact us at{' '}
            <a href="mailto:hello@policyengine.org">hello@policyengine.org</a>.
          </p>
        </RichTextBlock>
      </ContentSection>
    </StaticPageLayout>
  );
}
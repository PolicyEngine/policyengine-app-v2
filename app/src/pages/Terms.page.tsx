import LegalPageLayout, { LegalSection } from '@/components/shared/static/LegalPageLayout';
import { useParams } from 'react-router-dom';

export default function TermsPage() {
  const { countryId } = useParams<{ countryId: string }>();

  const DEFAULT_COUNTRY = 'the United Kingdom';
  const countryName = countryId === 'us' ? 'the United States' : DEFAULT_COUNTRY;

  const sections: LegalSection[] = [
    {
      heading: 'Introduction',
      content: (
        <p>
          1. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the
          PolicyEngine website and simulation tools (the &quot;Service&quot;) provided by
          PolicyEngine. By accessing or using the Service, you agree to be bound by these Terms.
        </p>
      ),
    },
    {
      heading: 'Use of the Service',
      content: (
        <>
          <p>
            2.1 The Service is provided for informational and educational purposes only.
            PolicyEngine does not guarantee the accuracy, completeness, or reliability of the
            information or analysis provided through the Service.
          </p>
          <p>2.2 You are responsible for any activity that occurs through your use of the Service.</p>
          <p>2.3 You agree not to use the Service for any unlawful or prohibited purpose.</p>
        </>
      ),
    },
    {
      heading: 'Intellectual property',
      content: (
        <>
          <p>
            3.1 The Service, including all content, software, and other materials, is owned by
            PolicyEngine and protected by intellectual property laws.
          </p>
          <p>
            3.2 PolicyEngine grants you a limited, revocable, non-exclusive, non-transferable
            license to access and use the Service for your personal, non-commercial use.
          </p>
        </>
      ),
    },
    {
      heading: 'User submissions',
      content: (
        <p>
          4.1 By submitting content or data to the Service, you grant PolicyEngine a worldwide,
          non-exclusive, royalty-free license to use, reproduce, modify, and distribute such content
          or data in connection with the Service.
        </p>
      ),
    },
    {
      heading: 'Third-party websites and services',
      content: (
        <p>
          5.1 The Service may contain links to third-party websites or services. PolicyEngine is not
          responsible for the content or practices of these third-party websites or services.
        </p>
      ),
    },
    {
      heading: 'Disclaimer of warranties',
      content: (
        <p>
          6.1 The Service is provided &quot;as is&quot; without warranties of any kind, express or
          implied, including but not limited to warranties of merchantability, fitness for a
          particular purpose, and non-infringement.
        </p>
      ),
    },
    {
      heading: 'Limitation of liability',
      content: (
        <p>
          7.1 In no event shall PolicyEngine be liable for any indirect, incidental, special, or
          consequential damages arising out of or in connection with the use or inability to use the
          Service.
        </p>
      ),
    },
    {
      heading: 'Termination',
      content: (
        <p>
          8.1 PolicyEngine reserves the right to terminate or suspend your access to the Service at
          any time, with or without cause or notice.
        </p>
      ),
    },
    {
      heading: 'Governing law',
      content: (
        <p>
          9.1 These Terms shall be governed by and construed in accordance with the laws of{' '}
          {countryName}.
        </p>
      ),
    },
    {
      heading: 'Changes to the terms',
      content: (
        <p>
          10.1 PolicyEngine may update this privacy policy at any time in order to reflect, for
          example, changes to our practices or for other operational legal or regulatory reasons.
          PolicyEngine will update this page with a changelog, and the full history of changes is be
          available on our{' '}
          <a
            href="https://github.com/policyengine/policyengine-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repository
          </a>
          .
        </p>
      ),
    },
  ];

  return <LegalPageLayout title="Terms of Service" sections={sections} />;
}

import LegalPageLayout, { LegalSection } from '@/components/shared/static/LegalPageLayout';

const sections: LegalSection[] = [
  {
    heading: 'How does PolicyEngine use my data?',
    content: (
      <>
        <p>
          PolicyEngine does not store personally identifiable information. We <b>do</b> use Google
          Analytics to track site usage statistics using cookies. You can opt-out of this tracking
          by clicking the &quot;Necessary cookies only&quot; button on the cookie consent banner at
          the bottom of the page, in line with the General Data Protection Regulation.
        </p>
        <p>
          Sometimes external websites embed PolicyEngine-developed applications on their own pages
          as interactives. In these cases, the external website may on the same page collect data
          about your use of the PolicyEngine application: see their own privacy policy for details.
        </p>
        <p>
          When you create a household or policy reform, PolicyEngine stores an anonymous ID for it
          in the page URL: this is to enable you to refresh the page or share a link directly to a
          specific result without having to enter details again.
        </p>
      </>
    ),
  },
  {
    heading: 'Contributing to PolicyEngine',
    content: (
      <p>
        Many people contribute to the development of PolicyEngine models and applications in our
        open-source repositories on GitHub, and we display a running feed of GitHub activity on our
        homepage to highlight these contributions. By agreeing to the{' '}
        <a
          href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub privacy policy
        </a>
        , contributors agree that their GitHub username can be used for this purpose.
      </p>
    ),
  },
  {
    heading: 'Changes to this privacy policy',
    content: (
      <p>
        We may update this privacy policy at any time in order to reflect, for example, changes to
        our practices or for other operational legal or regulatory reasons. We will update this
        page with a changelog, and the full history of changes is be available on our{' '}
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

export default function PrivacyPage() {
  return <LegalPageLayout title="Privacy" sections={sections} />;
}

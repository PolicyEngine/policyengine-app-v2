import type { Metadata } from "next";
import LegalPageLayout, {
  LegalSection,
} from "@/components/static/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy policy",
};

const PRIVACY_HISTORY_URL =
  "https://github.com/PolicyEngine/policyengine-app-v2/commits/main/website/src/app/%5BcountryId%5D/privacy/page.tsx";
const LEGACY_PRIVACY_HISTORY_URL =
  "https://github.com/PolicyEngine/policyengine-app-v2/commits/main/app/src/pages/Privacy.page.tsx";
const V1_PRIVACY_HISTORY_URL =
  "https://github.com/PolicyEngine/policyengine-app/commits/main/src/pages/PrivacyPage.jsx";

const sections: LegalSection[] = [
  {
    heading: "How does PolicyEngine use my data?",
    content: (
      <>
        <p>
          PolicyEngine does not store personally identifiable information. We{" "}
          <b>do</b> use Google Analytics to track site usage statistics using
          cookies. You can opt-out of this tracking by clicking the
          &quot;Necessary cookies only&quot; button on the cookie consent banner
          at the bottom of the page, in line with the General Data Protection
          Regulation.
        </p>
        <p>
          Sometimes external websites embed PolicyEngine-developed applications
          on their own pages as interactives. In these cases, the external
          website may on the same page collect data about your use of the
          PolicyEngine application: see their own privacy policy for details.
        </p>
        <p>
          When you create a household or policy reform, PolicyEngine stores an
          anonymous ID for it in the page URL: this is to enable you to refresh
          the page or share a link directly to a specific result without having
          to enter details again.
        </p>
      </>
    ),
  },
  {
    heading: "Contributing to PolicyEngine",
    content: (
      <p>
        Many people contribute to the development of PolicyEngine models and
        applications in our open-source repositories on GitHub, and we display a
        running feed of GitHub activity on our homepage to highlight these
        contributions. By agreeing to the{" "}
        <a
          href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub privacy policy
        </a>
        , contributors agree that their GitHub username can be used for this
        purpose.
      </p>
    ),
  },
  {
    heading: "Changes to this privacy policy",
    content: (
      <>
        <p>
          We may update this privacy policy at any time in order to reflect, for
          example, changes to our practices or for other operational, legal, or
          regulatory reasons. We will update this page with a changelog, and the
          full history of changes is available on our{" "}
          <a
            href={PRIVACY_HISTORY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repository
          </a>
          , with versions before March 2026 in{" "}
          <a
            href={LEGACY_PRIVACY_HISTORY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            an earlier file in the same repository
          </a>{" "}
          and our archived{" "}
          <a
            href={V1_PRIVACY_HISTORY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            policyengine-app repository
          </a>
          .
        </p>
        <p>Changelog:</p>
        <ul className="tw:list-disc">
          <li>
            2026-09-24: This section now links to this page&apos;s change
            history, including versions before March 2026, rather than to the
            home page of the archived policyengine-app repository.
          </li>
        </ul>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return <LegalPageLayout title="Privacy" sections={sections} />;
}

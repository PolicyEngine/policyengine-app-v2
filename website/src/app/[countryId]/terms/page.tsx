import type { Metadata } from "next";
import LegalPageLayout, {
  LegalSection,
} from "@/components/static/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of service",
};

const TERMS_HISTORY_URL =
  "https://github.com/PolicyEngine/policyengine-app-v2/commits/main/website/src/app/%5BcountryId%5D/terms/page.tsx";
const LEGACY_TERMS_HISTORY_URL =
  "https://github.com/PolicyEngine/policyengine-app-v2/commits/main/app/src/pages/Terms.page.tsx";
const V1_TERMS_HISTORY_URL =
  "https://github.com/PolicyEngine/policyengine-app/commits/main/src/pages/TermsAndConditions.jsx";

function buildSections(
  apiTermsPath: string,
  countryName: string,
): LegalSection[] {
  return [
    {
      heading: "Introduction",
      content: (
        <p>
          1. These Terms of Service (&quot;Terms&quot;) govern your access to
          and use of the PolicyEngine website and simulation tools (the
          &quot;Service&quot;) provided by PolicyEngine. By accessing or using
          the Service, you agree to be bound by these Terms. Access to the
          PolicyEngine API is governed by the separate{" "}
          <a href={apiTermsPath}>API Terms of Service</a>.
        </p>
      ),
    },
    {
      heading: "Use of the Service",
      content: (
        <>
          <p>
            2.1 The Service is provided for informational and educational
            purposes only. PolicyEngine does not guarantee the accuracy,
            completeness, or reliability of the information or analysis provided
            through the Service.
          </p>
          <p>
            2.2 You are responsible for any activity that occurs through your
            use of the Service.
          </p>
          <p>
            2.3 You agree not to use the Service for any unlawful or prohibited
            purpose.
          </p>
        </>
      ),
    },
    {
      heading: "Intellectual property",
      content: (
        <>
          <p>
            3.1 Except for public-domain material and as set out in 3.4, the
            Service, including its content, software, and other materials, is
            owned by PolicyEngine or its contributors and licensors and
            protected by intellectual property laws.
          </p>
          <p>
            3.2 PolicyEngine grants you a limited, revocable, non-exclusive,
            non-transferable license to access and use the Service, including
            for commercial purposes.
          </p>
          <p>
            3.3 PolicyEngine publishes much of the code, data, and content
            behind the Service in public repositories on{" "}
            <a
              href="https://github.com/PolicyEngine"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            . Material that PolicyEngine and its contributors publish in a
            repository under an open-source or open-content license, such as the
            GNU Affero General Public License v3.0, the MIT License, or Creative
            Commons Attribution 4.0, is governed by that license. Nothing in
            these Terms limits the rights that such a license grants or affirms,
            and where these Terms conflict with it, the license governs for that
            material. Third-party and public-domain material in those
            repositories keeps its own terms.
          </p>
          <p>
            3.4 PolicyEngine claims no rights in the laws and regulations that
            legislatures and governments make, or in the tax rates, brackets,
            thresholds, benefit amounts, and other values set by or under those
            laws, which the Service models. This does not change the license
            that applies to the code, documentation, or parameter files in which
            PolicyEngine records them (see 3.3).
          </p>
        </>
      ),
    },
    {
      heading: "User submissions",
      content: (
        <p>
          4.1 By submitting content or data to the Service, you grant
          PolicyEngine a worldwide, non-exclusive, royalty-free license to use,
          reproduce, modify, and distribute such content or data in connection
          with the Service.
        </p>
      ),
    },
    {
      heading: "Third-party websites and services",
      content: (
        <p>
          5.1 The Service may contain links to third-party websites or services.
          PolicyEngine is not responsible for the content or practices of these
          third-party websites or services.
        </p>
      ),
    },
    {
      heading: "Disclaimer of warranties",
      content: (
        <p>
          6.1 The Service is provided &quot;as is&quot; without warranties of
          any kind, express or implied, including but not limited to warranties
          of merchantability, fitness for a particular purpose, and
          non-infringement.
        </p>
      ),
    },
    {
      heading: "Limitation of liability",
      content: (
        <p>
          7.1 In no event shall PolicyEngine be liable for any indirect,
          incidental, special, or consequential damages arising out of or in
          connection with the use or inability to use the Service.
        </p>
      ),
    },
    {
      heading: "Termination",
      content: (
        <p>
          8.1 PolicyEngine reserves the right to terminate or suspend your
          access to the Service at any time, with or without cause or notice.
        </p>
      ),
    },
    {
      heading: "Governing law",
      content: (
        <p>
          9.1 These Terms shall be governed by and construed in accordance with
          the laws of {countryName}.
        </p>
      ),
    },
    {
      heading: "Changes to the terms",
      content: (
        <>
          <p>
            10.1 PolicyEngine may update these Terms at any time in order to
            reflect, for example, changes to our practices or for other
            operational, legal, or regulatory reasons. PolicyEngine will update
            this page with a changelog, and the full history of changes is
            available on our{" "}
            <a
              href={TERMS_HISTORY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub repository
            </a>
            , with versions before March 2026 in{" "}
            <a
              href={LEGACY_TERMS_HISTORY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              an earlier file in the same repository
            </a>{" "}
            and our archived{" "}
            <a
              href={V1_TERMS_HISTORY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              policyengine-app repository
            </a>
            .
          </p>
          <p>10.2 Changelog:</p>
          <ul className="tw:list-disc">
            <li>
              2026-09-23: Section 3 now recognizes PolicyEngine&apos;s
              contributors and licensors and public-domain material (3.1), no
              longer limits use of the Service to personal use and permits
              commercial use (3.2), defers to the open-source and open-content
              licenses of PolicyEngine&apos;s repositories (3.3), and states
              that PolicyEngine claims no rights in the underlying law, rates,
              and thresholds (3.4). Section 1 points to the separate API Terms
              of Service. Section 10.1 now refers to these Terms rather than the
              privacy policy and links to this page&apos;s change history,
              including versions before March 2026.
            </li>
          </ul>
        </>
      ),
    },
  ];
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  const countryName =
    countryId === "us" ? "the United States" : "the United Kingdom";
  // household-api-docs serves API terms only for the US and the UK.
  const apiTermsPath = `/${countryId === "uk" ? "uk" : "us"}/api/terms`;
  const sections = buildSections(apiTermsPath, countryName);

  return <LegalPageLayout title="Terms of service" sections={sections} />;
}

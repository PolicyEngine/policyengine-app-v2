import type { Metadata } from "next";
import Link from "next/link";
import ContentSection from "@/components/static/ContentSection";
import HeroSection from "@/components/static/HeroSection";
import OrganizationUseList from "@/components/static/OrganizationUseList";
import { getOrganizationUses } from "@/data/organizations";

export const metadata: Metadata = {
  title: "Who uses PolicyEngine",
  description:
    "Governments, researchers and benefit services that have used PolicyEngine, with how each one used it and a link to its source.",
};

const linkClassName =
  "tw:text-text-link tw:underline tw:underline-offset-2 tw:hover:text-text-link-hover";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  const isUk = countryId === "uk";
  const organisationText = isUk ? "organisation" : "organization";
  const licenceText = isUk ? "licence" : "license";
  const analyseText = isUk ? "analyse" : "analyze";
  const groups = getOrganizationUses().filter(
    (group) => group.organizations.length > 0,
  );

  return (
    <div>
      <HeroSection
        title="Who uses PolicyEngine"
        description={`Governments, researchers and benefit services have used PolicyEngine's open-source models and API. Each entry says how and links to its source: the ${organisationText}'s own page or document, or PolicyEngine's where the ${organisationText} has published none.`}
      />
      <ContentSection>
        {groups.map((group) => (
          <OrganizationUseList
            key={group.id}
            id={group.id}
            title={group.title}
            organizations={group.organizations}
          />
        ))}
      </ContentSection>
      <ContentSection variant="secondary">
        <div className="tw:max-w-[42rem] tw:text-base tw:leading-relaxed">
          <p>
            We publish PolicyEngine&apos;s software under an open-source{" "}
            {licenceText}, so this page lists only the uses we know of. Email{" "}
            <a href="mailto:hello@policyengine.org" className={linkClassName}>
              hello@policyengine.org
            </a>{" "}
            to tell us about yours.
          </p>
          <p className="tw:mt-lg">
            The{" "}
            <Link href={`/${countryId}/citations`} className={linkClassName}>
              Citations
            </Link>{" "}
            page lists articles, reports and official documents that cite
            PolicyEngine&apos;s research and tools.
          </p>
          <p className="tw:mt-lg">
            PolicyEngine takes no position on the policies these{" "}
            {organisationText}s {analyseText}.
          </p>
        </div>
      </ContentSection>
    </div>
  );
}

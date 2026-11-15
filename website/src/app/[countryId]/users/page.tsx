import type { Metadata } from "next";
import Link from "next/link";
import ContentSection from "@/components/static/ContentSection";
import HeroSection from "@/components/static/HeroSection";
import OrganizationUseList from "@/components/static/OrganizationUseList";
import { getOrganizationUses } from "@/data/organizations";

export const metadata: Metadata = {
  title: "Who uses PolicyEngine",
  description:
    "Governments, researchers and benefit services that use PolicyEngine, with what each one does and a link to its source.",
};

const linkClassName =
  "tw:text-text-link tw:underline tw:underline-offset-2 tw:hover:text-text-link-hover";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  const organisationText = countryId === "uk" ? "organisation" : "organization";
  const groups = getOrganizationUses().filter(
    (group) => group.organizations.length > 0,
  );

  return (
    <div>
      <HeroSection
        title="Who uses PolicyEngine"
        description={`Governments, researchers and benefit services use PolicyEngine's open-source models and API. Each entry says what the ${organisationText} does with PolicyEngine and links to its source.`}
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
            PolicyEngine publishes its software under an open-source license, so
            this page lists only the uses we know of. Email{" "}
            <a href="mailto:hello@policyengine.org" className={linkClassName}>
              hello@policyengine.org
            </a>{" "}
            to add yours.
          </p>
          <p className="tw:mt-lg">
            <Link href={`/${countryId}/citations`} className={linkClassName}>
              Citations
            </Link>{" "}
            lists the articles, reports and official documents that cite
            PolicyEngine&apos;s research and tools.
          </p>
        </div>
      </ContentSection>
    </div>
  );
}

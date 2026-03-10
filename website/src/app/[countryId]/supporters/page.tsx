import type { Metadata } from "next";
import HeroSection from "@/components/static/HeroSection";
import ContentSection from "@/components/static/ContentSection";
import SupporterCard from "@/components/static/SupporterCard";
import { getSupportersWithTotals } from "@/data/supporters";

export const metadata: Metadata = {
  title: "Supporters",
};

export default async function SupportersPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  const organisationsText =
    countryId === "uk" ? "organisations" : "organizations";
  const supportersWithTotals = getSupportersWithTotals();

  return (
    <div>
      <HeroSection
        title="Our supporters"
        description={
          <span>
            PolicyEngine gratefully acknowledges the {organisationsText} and
            individuals whose <strong>grants, contracts, and donations</strong>{" "}
            make our work possible.
          </span>
        }
      />
      <ContentSection>
        {supportersWithTotals.map(
          ({ supporter, projects: supporterProjects }) => (
            <SupporterCard
              key={supporter.id}
              supporter={supporter}
              projects={supporterProjects}
            />
          ),
        )}
      </ContentSection>
    </div>
  );
}

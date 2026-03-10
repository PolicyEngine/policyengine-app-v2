import type { Metadata } from "next";
import HeroSection from "@/components/static/HeroSection";
import TeamSection from "@/components/static/TeamSection";
import { founders, staff } from "@/data/team";

export const metadata: Metadata = {
  title: "Team",
};

export default function TeamPage() {
  return (
    <div>
      <HeroSection
        title="Our people"
        description="PolicyEngine's team leads a global movement of open-source contributors."
      />
      <TeamSection title="Founders" members={founders} variant="primary" />
      <TeamSection title="Team" members={staff} variant="accent" />
    </div>
  );
}

import type { Metadata } from "next";
import HeroSection from "@/components/static/HeroSection";
import ApiStatusClient from "./ApiStatusClient";

export const metadata: Metadata = {
  title: "API status",
  description: "Monitor the current status and availability of PolicyEngine API services.",
};

export default function ApiStatusPage() {
  return (
    <div>
      <HeroSection
        title="API status"
        description="Monitor the current status and availability of PolicyEngine API services."
      />
      <ApiStatusClient />
    </div>
  );
}

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import TeamPage from "../../app/[countryId]/team/page";
import DonatePage from "../../app/[countryId]/donate/page";
import SupportersPage from "../../app/[countryId]/supporters/page";
import PrivacyPage from "../../app/[countryId]/privacy/page";
import TermsPage from "../../app/[countryId]/terms/page";
import ResearchPage from "../../app/[countryId]/research/page";
import ClaudePluginPage from "../../app/[countryId]/claude-plugin/page";

describe("static pages", () => {
  const pages = [
    { name: "Team", Component: TeamPage, heading: /our team/i },
    { name: "Donate", Component: DonatePage, heading: /donate/i },
    { name: "Supporters", Component: SupportersPage, heading: /our supporters/i },
    { name: "Privacy", Component: PrivacyPage, heading: /privacy policy/i },
    { name: "Terms", Component: TermsPage, heading: /terms of service/i },
    { name: "Research", Component: ResearchPage, heading: /research/i },
    { name: "Claude Plugin", Component: ClaudePluginPage, heading: /claude plugin/i },
  ];

  test.each(pages)("$name page renders heading", ({ Component, heading }) => {
    render(<Component />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(heading);
  });
});

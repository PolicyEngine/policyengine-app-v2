import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import DonatePage from "../../app/[countryId]/donate/page";
import PrivacyPage from "../../app/[countryId]/privacy/page";
import TermsPage from "../../app/[countryId]/terms/page";
import ResearchPage from "../../app/[countryId]/research/page";
import ClaudePluginPage from "../../app/[countryId]/claude-plugin/page";

describe("static pages", () => {
  test("Donate page renders heading", async () => {
    const el = await DonatePage({
      params: Promise.resolve({ countryId: "us" }),
    });
    render(el);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /donate/i,
    );
  });

  test("Privacy page renders heading", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /privacy/i,
    );
  });

  test("Terms page renders with country params", async () => {
    const el = await TermsPage({
      params: Promise.resolve({ countryId: "us" }),
    });
    render(el);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /terms of service/i,
    );
    expect(screen.getByText(/the United States/)).toBeInTheDocument();
  });

  test("Research page returns a valid element", async () => {
    const el = await ResearchPage({
      params: Promise.resolve({ countryId: "us" }),
    });
    // Server component wraps a client component — just verify it returns JSX
    expect(el).toBeTruthy();
    expect(el.type).toBeDefined();
  });

  test("Claude Plugin page returns a valid element", async () => {
    const el = await ClaudePluginPage({
      params: Promise.resolve({ countryId: "us" }),
    });
    expect(el).toBeTruthy();
    expect(el.type).toBeDefined();
  });
});

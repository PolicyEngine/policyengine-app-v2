import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import PrivacyPage from "../../app/[countryId]/privacy/page";

describe("privacy page change history", () => {
  test("says the change history is available, without the old typo", () => {
    const { container } = render(<PrivacyPage />);
    expect(container.textContent).not.toMatch(/is be available/);
    expect(container.textContent).toMatch(
      /the full history of changes is available on our GitHub repository/,
    );
    expect(container.textContent).toMatch(
      /other operational, legal, or regulatory reasons/,
    );
  });

  test("links the change history, including versions before March 2026", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("link", { name: "GitHub repository" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/PolicyEngine/policyengine-app-v2/commits/main/website/src/app/%5BcountryId%5D/privacy/page.tsx",
    );
    expect(
      screen.getByRole("link", {
        name: "an earlier file in the same repository",
      }),
    ).toHaveAttribute(
      "href",
      "https://github.com/PolicyEngine/policyengine-app-v2/commits/main/app/src/pages/Privacy.page.tsx",
    );
    expect(
      screen.getByRole("link", { name: "policyengine-app repository" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/PolicyEngine/policyengine-app/commits/main/src/pages/PrivacyPage.jsx",
    );
  });

  test("no longer links the archived repository's home page", () => {
    render(<PrivacyPage />);
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href")?.toLowerCase());
    expect(hrefs).not.toContain(
      "https://github.com/policyengine/policyengine-app",
    );
  });

  test("records the change in the changelog", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByText(
        /^\d{4}-\d{2}-\d{2}: This section now links to this page's change history/,
      ),
    ).toBeInTheDocument();
  });
});

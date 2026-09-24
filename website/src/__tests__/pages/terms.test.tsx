import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import TermsPage from "../../app/[countryId]/terms/page";

async function renderTerms(countryId: string) {
  const el = await TermsPage({ params: Promise.resolve({ countryId }) });
  return render(el);
}

describe("terms page licensing", () => {
  test("does not limit the Service to personal, non-commercial use", async () => {
    const { container } = await renderTerms("us");
    expect(container.textContent).not.toMatch(/non[-\s]?commercial/i);
    expect(screen.getByText(/^3\.2 /)).toHaveTextContent(
      /including for commercial purposes/,
    );
  });

  test("does not treat openly licensed material as unowned", async () => {
    await renderTerms("us");
    expect(screen.getByText(/^3\.1 /)).toHaveTextContent(
      /^3\.1 Except for public-domain material and as set out in 3\.4,/,
    );
  });

  test("defers to repository licenses for material published under them", async () => {
    await renderTerms("us");
    const clause = screen.getByText(/^3\.3 /);
    expect(clause).toHaveTextContent(/GNU Affero General Public License v3\.0/);
    expect(clause).toHaveTextContent(/MIT License/);
    expect(clause).toHaveTextContent(/Creative Commons Attribution 4\.0/);
    expect(clause).toHaveTextContent(
      /where these Terms conflict with it, the license governs/,
    );
    expect(clause).toHaveTextContent(
      /Third-party and public-domain material in those repositories keeps its own terms/,
    );
  });

  test("claims no rights in the underlying law, rates and thresholds", async () => {
    await renderTerms("us");
    const clause = screen.getByText(/^3\.4 /);
    expect(clause).toHaveTextContent(
      /claims no rights.*in the laws and regulations that legislatures and governments make/,
    );
    expect(clause).toHaveTextContent(/other values set by or under those laws/);
    expect(clause).toHaveTextContent(
      /does not change the license that applies to the code, documentation, or parameter files/,
    );
  });

  test.each([
    ["us", "/us/api/terms"],
    ["uk", "/uk/api/terms"],
    ["ca", "/us/api/terms"],
    ["ng", "/us/api/terms"],
    ["il", "/us/api/terms"],
  ])(
    "points %s readers to an API terms page that exists",
    async (countryId, href) => {
      await renderTerms(countryId);
      expect(
        screen.getByRole("link", { name: "API Terms of Service" }),
      ).toHaveAttribute("href", href);
    },
  );

  test("links the change history, including versions before March 2026", async () => {
    await renderTerms("us");
    expect(
      screen.getByRole("link", { name: "GitHub repository" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/PolicyEngine/policyengine-app-v2/commits/main/website/src/app/%5BcountryId%5D/terms/page.tsx",
    );
    expect(
      screen.getByRole("link", {
        name: "an earlier file in the same repository",
      }),
    ).toHaveAttribute(
      "href",
      "https://github.com/PolicyEngine/policyengine-app-v2/commits/main/app/src/pages/Terms.page.tsx",
    );
    expect(
      screen.getByRole("link", { name: "policyengine-app repository" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/PolicyEngine/policyengine-app/commits/main/src/pages/TermsAndConditions.jsx",
    );
    expect(screen.getByText(/^10\.1 /)).toHaveTextContent(
      /may update these Terms/,
    );
  });

  test("records the licensing change in the changelog", async () => {
    await renderTerms("us");
    expect(
      screen.getByText(/^\d{4}-\d{2}-\d{2}: Section 3 now recognizes/),
    ).toBeInTheDocument();
  });
});

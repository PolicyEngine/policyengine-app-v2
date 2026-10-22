import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import DonatePage from "../../app/[countryId]/donate/page";

describe("Donate page", () => {
  test("the donate button emails PolicyEngine", () => {
    render(<DonatePage />);

    const button = screen.getByRole("link", { name: /email us to donate/i });
    expect(button).toHaveAttribute(
      "href",
      "mailto:hello@policyengine.org?subject=Donation%20to%20PolicyEngine",
    );
  });

  test("no link on the page goes to Open Collective", () => {
    const { container } = render(<DonatePage />);

    const hrefs = [...container.querySelectorAll("a")].map(
      (a) => a.getAttribute("href") ?? "",
    );
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.filter((href) => /opencollective\.com/i.test(href))).toEqual(
      [],
    );
    expect(container.textContent).not.toMatch(/open collective/i);
  });

  test("checks go to PSL Foundation, earmarked for PolicyEngine", () => {
    render(<DonatePage />);

    expect(screen.getByText(/payable to PSL Foundation/)).toHaveTextContent(
      "write PolicyEngine on the memo line",
    );
    expect(screen.getByText(/2108 Greene St\./)).toHaveTextContent(
      "PolicyEngine, c/o PSL Foundation, 2108 Greene St., PO Box 50932, Columbia, SC 29250, USA.",
    );
  });

  test("the page names the sponsor's EIN and tax status", () => {
    render(<DonatePage />);

    const status = screen.getByText(/501\(c\)\(3\) public charity/);
    expect(status).toHaveTextContent(
      "501(c)(3) public charity (EIN 86-3092437)",
    );
    expect(status).toHaveTextContent(
      "gifts are tax-deductible in the US to the extent the law allows",
    );
  });

  test("donor-advised fund grants name PolicyEngine as their purpose", () => {
    render(<DonatePage />);

    expect(screen.getByText(/donor-advised fund/)).toHaveTextContent(
      "recommend a grant to PSL Foundation and name PolicyEngine as its purpose",
    );
  });
});

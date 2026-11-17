import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import DonatePage from "../../app/[countryId]/donate/page";

const PSL_EIN = "86-3092437";
const US_DEDUCTION_LINE =
  "US taxpayers can deduct donations to the extent the law allows.";
const US_CHARITY_LINE =
  "The PSL Foundation, a US charity, receives donations in US dollars, and US taxpayers can deduct them to the extent US law allows.";
const GIFT_AID_LINE = "Donations do not qualify for UK Gift Aid.";

async function renderDonate(countryId: string) {
  const el = await DonatePage({ params: Promise.resolve({ countryId }) });
  return render(el);
}

describe("donate page giving details", () => {
  test("given any country then it names the fiscal sponsor and its EIN", async () => {
    await renderDonate("us");
    expect(
      screen.getByText(/fiscally sponsors PolicyEngine/),
    ).toHaveTextContent(`501(c)(3) public charity (EIN ${PSL_EIN})`);
  });

  test("given any country then checks go to PSL Foundation with a memo", async () => {
    await renderDonate("uk");
    expect(screen.getByText(/^Make checks payable/)).toHaveTextContent(
      'Make checks payable to PSL Foundation, write "PolicyEngine" on the memo line, and mail them to PolicyEngine, c/o PSL Foundation, 2108 Greene St., PO Box 50932, Columbia, SC 29250, USA.',
    );
  });

  test("given any country then donor-advised fund grants name PSL and PolicyEngine", async () => {
    await renderDonate("ca");
    expect(screen.getByText(/donor-advised fund, recommend/)).toHaveTextContent(
      `recommend a grant to PSL Foundation (EIN ${PSL_EIN}) with "PolicyEngine" as its purpose or designation.`,
    );
  });

  test("given any country then bank transfers route to the team's email", async () => {
    await renderDonate("us");
    expect(
      screen.getByRole("link", { name: "hello@policyengine.org" }),
    ).toHaveAttribute("href", "mailto:hello@policyengine.org");
  });

  test("given any country then the card button still leads to the existing checkout", async () => {
    await renderDonate("uk");
    expect(screen.getByRole("link", { name: "Donate now" })).toHaveAttribute(
      "href",
      "https://opencollective.com/policyengine",
    );
    expect(screen.getByText("Donate via Open Collective")).toBeInTheDocument();
  });

  test("given US then the tax line covers US deductions only", async () => {
    const { container } = await renderDonate("us");
    expect(screen.getByText(US_DEDUCTION_LINE)).toBeInTheDocument();
    expect(container.textContent).not.toContain("US dollars");
    expect(container.textContent).not.toContain("Gift Aid");
  });

  test("given UK then the tax line says gifts miss Gift Aid", async () => {
    const { container } = await renderDonate("uk");
    expect(
      screen.getByText(/receives donations in US dollars/),
    ).toHaveTextContent(`${US_CHARITY_LINE} ${GIFT_AID_LINE}`);
    expect(container.textContent).not.toContain(US_DEDUCTION_LINE);
  });

  test.each(["ca", "ng", "il"])(
    "given %s then the tax line names a US charity without Gift Aid",
    async (countryId) => {
      const { container } = await renderDonate(countryId);
      expect(
        screen.getByText(/receives donations in US dollars/),
      ).toHaveTextContent(new RegExp(`^${escapeRegExp(US_CHARITY_LINE)}$`));
      expect(container.textContent).not.toContain("Gift Aid");
      expect(container.textContent).not.toContain(US_DEDUCTION_LINE);
    },
  );
});

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

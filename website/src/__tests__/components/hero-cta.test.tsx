import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import HeroCTA from "@/components/home/HeroCTA";

const CALCULATOR_URL = "https://app.policyengine.org";

describe("HeroCTA", () => {
  test.each(["us", "uk"])(
    "given the %s home page then the button opens that country's calculator",
    (countryId) => {
      render(<HeroCTA countryId={countryId} />);

      expect(
        screen.getByRole("link", { name: "Enter PolicyEngine" }),
      ).toHaveAttribute("href", `${CALCULATOR_URL}/${countryId}/reports`);
    },
  );

  test.each(["ca", "ng", "il"])(
    "given the %s home page, a country the calculator does not offer, then there is no calculator button",
    (countryId) => {
      render(<HeroCTA countryId={countryId} />);

      expect(
        screen.queryByRole("link", { name: "Enter PolicyEngine" }),
      ).not.toBeInTheDocument();
    },
  );
});

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import HeroCTA from "@/components/home/HeroCTA";
import { getToolsMenu } from "@/lib/toolsMenu";

describe("HeroCTA", () => {
  // The calculator's country root sends each country to its current
  // entry page (app v3's Build for the US, the reports list for the UK).
  test.each(["us", "uk"])(
    "links %s to the calculator's country root",
    (countryId) => {
      render(<HeroCTA countryId={countryId} />);

      expect(
        screen.getByRole("link", { name: "Enter PolicyEngine" }),
      ).toHaveAttribute("href", `https://app.policyengine.org/${countryId}`);
    },
  );

  test.each(["us", "uk"])(
    "links %s to the same place as the Tools menu's main app row",
    (countryId) => {
      render(<HeroCTA countryId={countryId} />);

      expect(
        screen.getByRole("link", { name: "Enter PolicyEngine" }),
      ).toHaveAttribute("href", getToolsMenu(countryId)[0].href);
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

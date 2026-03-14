import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import HomePage from "../../app/[countryId]/page";

describe("HomePage", () => {
  test("renders the PolicyEngine logo", async () => {
    const page = await HomePage({
      params: Promise.resolve({ countryId: "us" }),
    });
    render(page);
    expect(screen.getByAltText("PolicyEngine")).toBeInTheDocument();
  });

  test("renders org logos section for US", async () => {
    const page = await HomePage({
      params: Promise.resolve({ countryId: "us" }),
    });
    render(page);
    // Marquee duplicates logos, so use getAllByTitle
    const logos = screen.getAllByTitle("Niskanen Center");
    expect(logos.length).toBeGreaterThan(0);
  });

  test("renders blog preview section", async () => {
    const page = await HomePage({
      params: Promise.resolve({ countryId: "us" }),
    });
    render(page);
    // Blog preview section should exist with post links
    const links = screen.getAllByRole("link");
    // Should have many links (nav + org logos + blog posts)
    expect(links.length).toBeGreaterThan(5);
  });
});

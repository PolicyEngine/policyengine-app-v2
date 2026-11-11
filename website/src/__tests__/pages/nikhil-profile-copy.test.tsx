import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import TeamPage from "../../app/[countryId]/team/page";
import authorsData from "../../data/posts/authors.json";

describe("Nikhil Woodruff profile copy", () => {
  test("Team page describes his co-founder role in the past tense without the CTO title", () => {
    render(<TeamPage />);

    expect(
      screen.getByText(/was a co-founder of PolicyEngine/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\bCTO\b/i)).not.toBeInTheDocument();
  });

  test("research author metadata describes his former co-founder role without the CTO title", () => {
    expect(authorsData["nikhil-woodruff"]).toMatchObject({
      bio: "Nikhil was a co-founder of PolicyEngine.",
      title: "Former PolicyEngine co-founder",
    });
    expect(authorsData["nikhil-woodruff"].bio).not.toMatch(/\bCTO\b/i);
    expect(authorsData["nikhil-woodruff"].title).not.toMatch(/\bCTO\b/i);
  });
});

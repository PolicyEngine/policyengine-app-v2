import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import TeamPage from "../../app/[countryId]/team/page";
import authorsData from "../../data/posts/authors.json";

describe("Daphne Hansell profile copy", () => {
  test("Team page does not list Daphne as a current staff member", () => {
    render(<TeamPage />);

    expect(screen.queryByText(/Daphne Hansell/i)).not.toBeInTheDocument();
  });

  test("research author metadata describes her former position", () => {
    expect(authorsData["daphne-hansell"]).toMatchObject({
      bio: "Daphne was a research analyst at PolicyEngine.",
      title: "Former research analyst at PolicyEngine",
    });
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import TeamPage from "../../app/[countryId]/team/page";
import SupportersPage from "../../app/[countryId]/supporters/page";

describe("Team and Supporters pages", () => {
  test("Team page renders heading", () => {
    render(<TeamPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /our people/i,
    );
  });

  test("Team page renders founder names", () => {
    render(<TeamPage />);
    expect(screen.getByText(/Max Ghenis/)).toBeInTheDocument();
    expect(screen.getByText(/Nikhil Woodruff/)).toBeInTheDocument();
  });

  test("Team page renders section headings", () => {
    render(<TeamPage />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent("Founders");
    expect(headings[1]).toHaveTextContent("Team");
  });

  test("Supporters page renders heading", async () => {
    const params = Promise.resolve({ countryId: "us" });
    const el = await SupportersPage({ params });
    render(el);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /our supporters/i,
    );
  });

  test("Supporters page renders supporter names", async () => {
    const params = Promise.resolve({ countryId: "us" });
    const el = await SupportersPage({ params });
    render(el);
    expect(screen.getByText(/Nuffield Foundation/)).toBeInTheDocument();
    expect(screen.getByText(/Arnold Ventures/)).toBeInTheDocument();
  });

  test("Supporters page uses UK spelling for UK country", async () => {
    const params = Promise.resolve({ countryId: "uk" });
    const el = await SupportersPage({ params });
    render(el);
    expect(screen.getByText(/organisations/)).toBeInTheDocument();
  });
});

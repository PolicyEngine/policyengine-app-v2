import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import HomePage from "../../app/[countryId]/page";

describe("HomePage", () => {
  test("renders a heading", async () => {
    const page = await HomePage({ params: Promise.resolve({ countryId: "us" }) });
    render(page);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  test("displays US when countryId is us", async () => {
    const page = await HomePage({ params: Promise.resolve({ countryId: "us" }) });
    render(page);
    expect(screen.getByText(/US/)).toBeInTheDocument();
  });

  test("displays UK when countryId is uk", async () => {
    const page = await HomePage({ params: Promise.resolve({ countryId: "uk" }) });
    render(page);
    expect(screen.getByText(/UK/)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { notFound } from "next/navigation";

// Mock next/navigation since notFound() throws and Header/Footer use hooks
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  usePathname: vi.fn(() => "/us"),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

import CountryLayout from "../../app/[countryId]/layout";

describe("CountryLayout", () => {
  test("renders children for valid country", async () => {
    const layout = await CountryLayout({
      children: <div>Test content</div>,
      params: Promise.resolve({ countryId: "us" }),
    });
    render(layout);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  test("renders header and footer", async () => {
    const layout = await CountryLayout({
      children: <div>Content</div>,
      params: Promise.resolve({ countryId: "us" }),
    });
    render(layout);
    expect(screen.getByTestId("site-header")).toBeInTheDocument();
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });

  test("calls notFound for invalid country", async () => {
    await expect(
      CountryLayout({
        children: <div>Content</div>,
        params: Promise.resolve({ countryId: "invalid" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});

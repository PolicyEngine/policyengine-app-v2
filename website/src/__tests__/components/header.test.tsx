import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/us"),
  useRouter: vi.fn(() => ({ push: pushMock, replace: replaceMock })),
}));

import Header from "@/components/Header";

describe("Header", () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
  });

  test("keeps the mobile menu out of the DOM until it is opened", () => {
    render(<Header />);

    const openButton = screen.getByRole("button", { name: "Open menu" });
    expect(openButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Menu")).not.toBeInTheDocument();

    fireEvent.click(openButton);

    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  });
});

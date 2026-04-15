import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/us"),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

import Header from "@/components/Header";

describe("Header", () => {
  test("uses border-box sizing with responsive inline padding", () => {
    const { container } = render(<Header />);

    const header = container.querySelector('[data-testid="site-header"]');
    expect(header).toHaveStyle({
      width: "100%",
      boxSizing: "border-box",
      paddingInline: "clamp(16px, 4vw, 32px)",
    });
  });

  test("does not force desktop navigation to display via inline styles", () => {
    render(<Header />);

    expect(screen.getByTestId("desktop-nav")).not.toHaveStyle({ display: "flex" });
    expect(screen.getByTestId("mobile-controls")).toBeInTheDocument();
  });

  test("keeps the mobile menu panel within the viewport", () => {
    render(<Header />);

    const buttons = screen.getAllByRole("button");
    const menuButton = buttons.find(
      (button) => button.getAttribute("aria-label") === "Toggle navigation",
    );

    expect(menuButton).toBeDefined();
    fireEvent.click(menuButton!);

    expect(screen.getByText("Menu").parentElement?.parentElement).toHaveStyle({
      width: "min(300px, calc(100vw - 24px))",
      maxWidth: "100vw",
      boxSizing: "border-box",
    });
  });
});

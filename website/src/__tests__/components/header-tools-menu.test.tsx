import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/us"),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

// Mark client-side links so the tests can tell them from full page loads.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} data-next-link="" {...props}>
      {children}
    </a>
  ),
}));

import Header from "@/components/Header";

function openDesktopToolsMenu() {
  const desktopNav = screen.getByTestId("desktop-nav");
  fireEvent.click(within(desktopNav).getByRole("button", { name: "Tools" }));
  return desktopNav;
}

function mobileMenuPanel() {
  return screen.getByText("Menu").parentElement!.parentElement!;
}

describe("Header tools menu", () => {
  afterEach(() => {
    vi.mocked(usePathname).mockReturnValue("/us");
  });

  test("puts Tools right after Research in the desktop nav", () => {
    render(<Header />);

    const labels = Array.from(screen.getByTestId("desktop-nav").children).map(
      (item) => item.textContent,
    );
    expect(labels).toEqual([
      "Research",
      "Tools",
      "Model",
      "API",
      "Python",
      "About",
      "Donate",
    ]);
  });

  // jsdom has no layout, so these two check the styles that do the work, not
  // the wrapping or scrolling they cause (checked in a browser on the PR).
  test("gives the dropdown panel a max-content width over its 220px minimum", () => {
    render(<Header />);
    const desktopNav = openDesktopToolsMenu();

    const row = within(desktopNav).getByRole("link", {
      name: "OBBBA household explorer",
    });
    // row → padding div → panel
    expect(row.parentElement!.parentElement).toHaveStyle({
      width: "max-content",
      minWidth: "220px",
    });
  });

  test("lets the mobile menu panel scroll vertically", () => {
    render(<Header />);

    expect(mobileMenuPanel()).toHaveStyle({ overflowY: "auto" });
  });

  test("given the US site then the desktop Tools menu links CliffWatch and the OBBBA household explorer", () => {
    render(<Header />);
    const desktopNav = openDesktopToolsMenu();

    expect(
      within(desktopNav).getByRole("link", { name: "CliffWatch" }),
    ).toHaveAttribute("href", "/us/cliffwatch");
    expect(
      within(desktopNav).getByRole("link", {
        name: "OBBBA household explorer",
      }),
    ).toHaveAttribute("href", "/us/obbba-households");
    expect(
      within(desktopNav).getByRole("link", {
        name: "State legislative tracker",
      }),
    ).toHaveAttribute("href", "/us/bill-tracker");
    expect(
      within(desktopNav).getByRole("link", { name: "All interactive tools" }),
    ).toHaveAttribute("href", "/us/research?types=interactive");
  });

  const US_TOOLS_ROWS = [
    "CliffWatch",
    "OBBBA household explorer",
    "State legislative tracker",
    "All interactive tools",
  ];

  test("given the US site then every desktop Tools link is a full page load", () => {
    render(<Header />);
    const desktopNav = openDesktopToolsMenu();

    for (const name of US_TOOLS_ROWS) {
      expect(
        within(desktopNav).getByRole("link", { name }),
      ).not.toHaveAttribute("data-next-link");
    }
  });

  test("given the US site then every mobile Tools link is a full page load", () => {
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle navigation" }));
    const panel = mobileMenuPanel();

    for (const name of US_TOOLS_ROWS) {
      expect(within(panel).getByRole("link", { name })).not.toHaveAttribute(
        "data-next-link",
      );
    }
  });

  test("given the US site then the mobile menu lists the same tools", () => {
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle navigation" }));
    const panel = mobileMenuPanel();

    expect(within(panel).getByText("Tools")).toBeInTheDocument();
    expect(
      within(panel).getByRole("link", { name: "CliffWatch" }),
    ).toHaveAttribute("href", "/us/cliffwatch");
    expect(
      within(panel).getByRole("link", { name: "OBBBA household explorer" }),
    ).toHaveAttribute("href", "/us/obbba-households");
    expect(
      within(panel).getByRole("link", { name: "All interactive tools" }),
    ).toHaveAttribute("href", "/us/research?types=interactive");
  });

  test("given the UK site then the Tools menu offers UK CliffWatch and no US-only tool", () => {
    vi.mocked(usePathname).mockReturnValue("/uk");
    const { container } = render(<Header />);
    const desktopNav = openDesktopToolsMenu();

    expect(
      within(desktopNav).getByRole("link", { name: "UK CliffWatch" }),
    ).toHaveAttribute("href", "/uk/uk-cliff-watch");
    expect(
      within(desktopNav).getByRole("link", { name: "All interactive tools" }),
    ).toHaveAttribute("href", "/uk/research?types=interactive");

    // /uk/cliffwatch only redirects to UK CliffWatch, so link that directly;
    // the OBBBA explorer and the state tracker are US-only.
    const hrefs = Array.from(container.querySelectorAll("a")).map((link) =>
      link.getAttribute("href"),
    );
    expect(hrefs).not.toContain("/uk/cliffwatch");
    expect(hrefs).not.toContain("/uk/obbba-households");
    expect(hrefs).not.toContain("/uk/bill-tracker");
  });

  test("given a country with no featured tools then shows no Tools menu", () => {
    vi.mocked(usePathname).mockReturnValue("/ca");
    render(<Header />);

    expect(screen.queryByRole("button", { name: "Tools" })).toBeNull();
    expect(screen.queryByText("Tools")).toBeNull();
  });
});

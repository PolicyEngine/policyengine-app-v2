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
import { getToolsMenu } from "@/lib/toolsMenu";

function openDesktopToolsMenu() {
  const desktopNav = screen.getByTestId("desktop-nav");
  fireEvent.click(within(desktopNav).getByRole("button", { name: "Tools" }));
  return desktopNav;
}

function mobileMenuPanel() {
  return screen.getByText("Menu").parentElement!.parentElement!;
}

function rowsOf(links: HTMLElement[]) {
  return links.map((link) => ({
    label: link.textContent,
    href: link.getAttribute("href"),
    clientSide: link.hasAttribute("data-next-link"),
  }));
}

/** The desktop Tools dropdown's rows, in order. */
function desktopToolsRows() {
  const desktopNav = openDesktopToolsMenu();
  // row → padding div, which holds every row
  const rowList = within(desktopNav).getByRole("link", {
    name: "PolicyEngine app",
  }).parentElement!;
  return rowsOf(within(rowList).getAllByRole("link"));
}

/** The mobile menu's Tools rows, in order. */
function mobileToolsRows() {
  fireEvent.click(screen.getByRole("button", { name: "Toggle navigation" }));
  // "Tools" label → its section, which holds the rows
  const section = within(mobileMenuPanel()).getByText("Tools").parentElement!;
  return rowsOf(within(section).getAllByRole("link"));
}

/** The rows getToolsMenu says the country should get, all full page loads. */
function expectedRows(countryId: string) {
  return getToolsMenu(countryId).map((tool) => ({
    label: tool.label,
    href: tool.href,
    clientSide: false,
  }));
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
      name: "SPM threshold calculator",
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

  test.each(["us", "uk"])(
    "given %s then the desktop Tools menu lists the main app, then the tools, each a full page load",
    (countryId) => {
      vi.mocked(usePathname).mockReturnValue(`/${countryId}`);
      render(<Header />);

      expect(desktopToolsRows()).toEqual(expectedRows(countryId));
    },
  );

  test.each(["us", "uk"])(
    "given %s then the mobile Tools menu lists the main app, then the tools, each a full page load",
    (countryId) => {
      vi.mocked(usePathname).mockReturnValue(`/${countryId}`);
      render(<Header />);

      expect(mobileToolsRows()).toEqual(expectedRows(countryId));
    },
  );

  test("given the US then the first row opens the main app and the tools follow", () => {
    render(<Header />);

    const rows = desktopToolsRows();
    expect(rows[0]).toEqual({
      label: "PolicyEngine app",
      href: "https://app.policyengine.org/us",
      clientSide: false,
    });
    expect(rows).toContainEqual({
      label: "CliffWatch",
      href: "/us/cliffwatch",
      clientSide: false,
    });
  });

  test("given the US then the OBBBA explorer and the bill tracker are not in the Tools menu", () => {
    render(<Header />);

    const hrefs = desktopToolsRows().map((row) => row.href);
    expect(hrefs).not.toContain("/us/obbba-households");
    expect(hrefs).not.toContain("/us/bill-tracker");
    expect(hrefs).not.toContain("/us/research?types=interactive");
  });

  test("given the UK site then the Tools menu offers UK CliffWatch and no US-only tool", () => {
    vi.mocked(usePathname).mockReturnValue("/uk");
    const { container } = render(<Header />);

    expect(desktopToolsRows()).toContainEqual({
      label: "UK CliffWatch",
      href: "/uk/uk-cliff-watch",
      clientSide: false,
    });

    // /uk/cliffwatch only redirects to UK CliffWatch, so link that directly;
    // the OBBBA explorer and the state tracker are US-only.
    const hrefs = Array.from(container.querySelectorAll("a")).map((link) =>
      link.getAttribute("href"),
    );
    expect(hrefs).not.toContain("/uk/cliffwatch");
    expect(hrefs).not.toContain("/uk/obbba-households");
    expect(hrefs).not.toContain("/uk/bill-tracker");
  });

  test("given a country with no tools then shows no Tools menu, not even for the main app", () => {
    vi.mocked(usePathname).mockReturnValue("/ca");
    render(<Header />);

    expect(screen.queryByRole("button", { name: "Tools" })).toBeNull();
    expect(screen.queryByText("Tools")).toBeNull();
    expect(screen.queryByText("PolicyEngine app")).toBeNull();
  });
});

import { fireEvent, render, screen, within } from "@testing-library/react";
import fc from "fast-check";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/us"),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

import UsersPage from "../../app/[countryId]/users/page";
import sitemap from "@/app/sitemap";
import Header from "@/components/Header";
import {
  getOrganizationUses,
  getOrgsForCountry,
  type Organization,
  type OrganizationWithUse,
  organizations,
  USE_CATEGORIES,
  type UseCategory,
} from "@/data/organizations";

const US = "us";
const UK = "uk";
const TOP_HIGHLIGHT = "No 10 data science team";

const organizationsWithUse = Object.values(organizations).filter(
  (org): org is OrganizationWithUse => org.use !== undefined,
);

async function renderUsersPage(countryId: string) {
  render(await UsersPage({ params: Promise.resolve({ countryId }) }));
}

describe("users page", () => {
  test("given the US route then the heading asks who uses PolicyEngine", async () => {
    await renderUsersPage(US);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Who uses PolicyEngine",
    );
  });

  test("given the data file then the page has entries to render", () => {
    expect(organizationsWithUse.length).toBeGreaterThan(0);
  });

  test.each(organizationsWithUse.map((org) => [org.name, org] as const))(
    "given %s in the data file then the page renders its name, sentence and source",
    async (_name, org) => {
      await renderUsersPage(US);

      const heading = screen.getByRole("heading", { level: 3, name: org.name });
      const row = heading.closest("li");
      expect(row).not.toBeNull();
      expect(within(heading).getByRole("link")).toHaveAttribute(
        "href",
        org.link,
      );
      expect(
        within(row as HTMLElement).getByText(org.use.description),
      ).toBeInTheDocument();
      expect(
        within(row as HTMLElement).getByRole("link", {
          name: org.use.source.label,
        }),
      ).toHaveAttribute("href", org.use.source.url);
    },
  );

  test("given the data file then the page renders one row per entry and no others", async () => {
    await renderUsersPage(US);

    const rendered = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(rendered).toHaveLength(organizationsWithUse.length);
    expect([...rendered].sort()).toEqual(
      organizationsWithUse.map((org) => org.name).sort(),
    );
  });

  test("given either country then the page lists the same entries in the same order", async () => {
    await renderUsersPage(US);
    const us = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    document.body.innerHTML = "";
    await renderUsersPage(UK);
    const uk = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);

    expect(uk).toEqual(us);
  });

  test("given the groups then their headings follow the category order", async () => {
    await renderUsersPage(US);

    const used = new Set(organizationsWithUse.map((org) => org.use.category));
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(
      USE_CATEGORIES.filter((category) => used.has(category.id)).map(
        (category) => category.title,
      ),
    );
  });

  test("given the page then No 10 leads it", async () => {
    await renderUsersPage(US);

    expect(screen.getAllByRole("heading", { level: 3 })[0]).toHaveTextContent(
      TOP_HIGHLIGHT,
    );
  });

  test("given the UK route then the introduction uses UK spelling", async () => {
    await renderUsersPage(UK);

    expect(screen.getByText(/what the organisation does/)).toBeInTheDocument();
  });

  test("given the page then it links to the citations page for that country", async () => {
    await renderUsersPage(UK);

    expect(screen.getByRole("link", { name: "Citations" })).toHaveAttribute(
      "href",
      "/uk/citations",
    );
  });
});

describe("users page entries", () => {
  test.each(organizationsWithUse.map((org) => [org.name, org] as const))(
    "given %s then its entry is one sentence with an https source",
    (_name, org) => {
      const { description, source } = org.use;

      expect(description.trim()).toBe(description);
      expect(description).toMatch(/^[A-Z0-9].*\.$/);
      expect(description).not.toMatch(/\n/);
      expect(source.label.trim()).not.toBe("");
      expect(new URL(source.url).protocol).toBe("https:");
      expect(new URL(org.link).protocol).toBe("https:");
    },
  );

  // Funders, grants and money stay off this page: it lists users.
  test.each(organizationsWithUse.map((org) => [org.name, org] as const))(
    "given %s then its entry names no money, grant or funder",
    (_name, org) => {
      expect(org.use.description).not.toMatch(/[$£€]/);
      expect(org.use.description).not.toMatch(
        /\b(grants?|funds?|funded|funders?|funding|donat\w*)\b/i,
      );
    },
  );

  test("given each category then no two entries share a rank", () => {
    for (const { id } of USE_CATEGORIES) {
      const ranks = organizationsWithUse
        .filter((org) => org.use.category === id)
        .map((org) => org.use.rank);
      expect(new Set(ranks).size).toBe(ranks.length);
    }
  });

  test("given the entries then no two share a name", () => {
    const names = organizationsWithUse.map((org) => org.name);
    expect(new Set(names).size).toBe(names.length);
  });

  test("given an organization then it appears in the logo strip or on the users page", () => {
    for (const org of Object.values(organizations)) {
      expect(org.logo !== undefined || org.use !== undefined).toBe(true);
    }
  });
});

describe("getOrganizationUses", () => {
  const categoryIds = USE_CATEGORIES.map((category) => category.id);
  const arbitraryOrganization = fc.record(
    {
      name: fc.string(),
      link: fc.constant("https://example.org/"),
      countries: fc.constant<Organization["countries"]>(["us"]),
      use: fc.record({
        category: fc.constantFrom<UseCategory>(...categoryIds),
        rank: fc.integer({ min: -50, max: 50 }),
        description: fc.string(),
        source: fc.record({
          label: fc.string(),
          url: fc.constant("https://example.org/source"),
          publisher: fc.constantFrom<"organization" | "policyengine">(
            "organization",
            "policyengine",
          ),
        }),
      }),
    },
    { requiredKeys: ["name", "link", "countries"] },
  );

  test("given any set of organizations then each one with a use lands once, in its category, in rank order", () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string({ minLength: 1 }), arbitraryOrganization),
        (source) => {
          const groups = getOrganizationUses(source);
          const expected = Object.values(source).filter(
            (org) => org.use !== undefined,
          );

          // Groups come in category order, one per category
          expect(groups.map((group) => group.id)).toEqual(categoryIds);
          // Partition: every entry with a use appears exactly once
          const placed = groups.flatMap((group) => group.organizations);
          expect(placed).toHaveLength(expected.length);
          expect(new Set(placed)).toEqual(new Set(expected));
          for (const group of groups) {
            // Each entry sits in its own category
            for (const org of group.organizations) {
              expect(org.use.category).toBe(group.id);
            }
            // Ranks never fall within a group
            const ranks = group.organizations.map((org) => org.use.rank);
            expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
          }
        },
      ),
    );
  });
});

describe("logo strip", () => {
  test.each([US, UK])(
    "given %s then the strip holds only organizations with a logo for that country",
    (countryId) => {
      const strip = getOrgsForCountry(countryId);

      expect(strip.length).toBeGreaterThan(0);
      for (const org of strip) {
        expect(org.logo).toBeDefined();
        expect(org.countries).toContain(countryId);
      }
      expect(strip).toEqual(
        Object.values(organizations).filter(
          (org) =>
            org.logo !== undefined &&
            (org.countries as string[]).includes(countryId),
        ),
      );
    },
  );
});

describe("links to the users page", () => {
  test("given the header then the About menu links to the users page", () => {
    render(<Header />);

    const desktopNav = screen.getByTestId("desktop-nav");
    fireEvent.click(within(desktopNav).getByRole("button", { name: "About" }));

    expect(
      within(desktopNav).getByRole("link", { name: "Users" }),
    ).toHaveAttribute("href", "/us/users");
  });

  test.each([US, UK])(
    "given %s then the sitemap lists its users page",
    (countryId) => {
      expect(sitemap().map((entry) => entry.url)).toContain(
        `https://www.policyengine.org/${countryId}/users`,
      );
    },
  );
});

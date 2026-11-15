import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import fc from "fast-check";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/us"),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

import CitationsClient from "../../app/[countryId]/citations/CitationsClient";
import UsersPage, { metadata } from "../../app/[countryId]/users/page";
import sitemap from "@/app/sitemap";
import Header from "@/components/Header";
import OrganizationUseList from "@/components/static/OrganizationUseList";
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

  test("given the page then its browser title asks who uses PolicyEngine", () => {
    expect(metadata.title).toBe("Who uses PolicyEngine");
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
        org.use.site ?? org.link,
      );
      expect(
        within(row as HTMLElement).getByText(org.use.description),
      ).toBeInTheDocument();
      for (const source of org.use.sources) {
        expect(
          within(row as HTMLElement).getByRole("link", { name: source.label }),
        ).toHaveAttribute("href", source.url);
      }
      // The source line names each source in order: "Source: A",
      // "Sources: A and B", or "Sources: A; B; and C"
      const labels = org.use.sources.map((source) => source.label);
      const listed =
        labels.length <= 2
          ? labels.join(" and ")
          : `${labels.slice(0, -1).join("; ")}; and ${labels[labels.length - 1]}`;
      expect(
        within(row as HTMLElement).getByText(/^Sources?:/).textContent,
      ).toBe(`${labels.length === 1 ? "Source" : "Sources"}: ${listed}`);
      // The name goes to the organization's site, never to one of its sources
      expect(org.use.sources.map((source) => source.url)).not.toContain(
        org.use.site ?? org.link,
      );
      // The name link and one link per source, and no others
      const links = within(row as HTMLElement).getAllByRole("link");
      expect(links).toHaveLength(1 + org.use.sources.length);
      // Each leaves the site, in a new tab
      for (const link of links) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
      // The row sits in the section that its group's heading names
      const category = USE_CATEGORIES.find(
        (candidate) => candidate.id === org.use.category,
      );
      expect(
        screen.getByRole("region", { name: category?.title }),
      ).toContainElement(row as HTMLElement);
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
    cleanup();
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

  test("given the page then government comes first, then research, then benefit services", async () => {
    await renderUsersPage(US);

    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(["Government", "Research", "Benefit services"]);
  });

  test("given the page then No 10 leads it", async () => {
    await renderUsersPage(US);

    expect(screen.getAllByRole("heading", { level: 3 })[0]).toHaveTextContent(
      TOP_HIGHLIGHT,
    );
  });

  test("given the UK route then the page's own text uses UK spelling", async () => {
    await renderUsersPage(UK);

    expect(
      screen.getByText(
        "Governments, researchers and benefit services have used PolicyEngine's open-source models and API. Each entry says how and links to its sources. A label that starts with PolicyEngine marks a page PolicyEngine published.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/open-source licence,/)).toBeInTheDocument();
    expect(
      screen.getByText(/the policies these organisations analyse\./),
    ).toBeInTheDocument();
  });

  test("given the UK route then no US spelling shows outside the entries", async () => {
    await renderUsersPage(UK);

    const main = screen.getByRole("heading", { level: 1 }).closest("div")
      ?.parentElement as HTMLElement;
    const ownText = [...main.querySelectorAll("h1, h2, p")]
      .filter((element) => element.closest("li") === null)
      .map((element) => element.textContent)
      .join(" ");
    expect(ownText).toMatch(/organisation/);
    expect(ownText).not.toMatch(/organiz|license|analyz/i);
  });

  test("given the US route then the page's own text uses US spelling", async () => {
    await renderUsersPage(US);

    expect(
      screen.getByText(
        "Governments, researchers and benefit services have used PolicyEngine's open-source models and API. Each entry says how and links to its sources. A label that starts with PolicyEngine marks a page PolicyEngine published.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/open-source license,/)).toBeInTheDocument();
    expect(
      screen.getByText(/the policies these organizations analyze\./),
    ).toBeInTheDocument();
  });

  test("given the page then it links to the citations page for that country", async () => {
    await renderUsersPage(UK);

    expect(screen.getByRole("link", { name: "Citations" })).toHaveAttribute(
      "href",
      "/uk/citations",
    );
  });
});

describe("source line", () => {
  const source = (label: string) => ({
    label,
    url: `https://example.org/${label.toLowerCase()}`,
    publisher: "organization" as const,
  });

  test.each([
    [["A"], "Source: A"],
    [["A", "B"], "Sources: A and B"],
    [["A", "B", "C"], "Sources: A; B; and C"],
  ])("given sources %j then the line reads %s", (labels, line) => {
    const [first, ...rest] = labels.map(source);
    render(
      <OrganizationUseList
        id="example"
        title="Example group"
        organizations={[
          {
            name: "Example organization",
            link: "https://example.org/",
            countries: ["us"],
            use: {
              category: "research",
              rank: 1,
              description: "Example organization ran PolicyEngine.",
              sources: [first, ...rest],
            },
          },
        ]}
      />,
    );

    expect(screen.getByText(/^Sources?:/).textContent).toBe(line);
    expect(
      within(screen.getByText(/^Sources?:/))
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(labels.map((label) => source(label).url));
  });
});

describe("users page entries", () => {
  test.each(organizationsWithUse.map((org) => [org.name, org] as const))(
    "given %s then its entry is one sentence with an https source",
    (_name, org) => {
      const { description, sources } = org.use;

      expect(description.trim()).toBe(description);
      expect(description).toMatch(/^[A-Z0-9].*\.$/);
      expect(description).not.toMatch(/\n/);
      // No second sentence starts inside it
      expect(description).not.toMatch(/[.!?]\s+[A-Z]/);
      expect(sources.length).toBeGreaterThan(0);
      for (const source of sources) {
        expect(source.label.trim()).not.toBe("");
        expect(new URL(source.url).protocol).toBe("https:");
      }
      expect(new Set(sources.map((source) => source.label)).size).toBe(
        sources.length,
      );
      expect(new Set(sources.map((source) => source.url)).size).toBe(
        sources.length,
      );
      expect(new URL(org.use.site ?? org.link).protocol).toBe("https:");
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

  // A reader must see when a claim rests on PolicyEngine's own page.
  test.each(organizationsWithUse.map((org) => [org.name, org] as const))(
    "given %s then each source PolicyEngine published says so in its label",
    (_name, org) => {
      for (const source of org.use.sources) {
        const onPolicyEngineSite = /(^|\.)policyengine\.org$/.test(
          new URL(source.url).hostname,
        );
        expect(source.publisher === "policyengine").toBe(onPolicyEngineSite);
        expect(/^PolicyEngine\b/.test(source.label)).toBe(onPolicyEngineSite);
      }
    },
  );

  // Each entry is a public claim about another organization. This snapshot
  // makes any change to the list or its wording a visible, deliberate edit.
  test("given the entries then they match the reviewed copy", () => {
    expect(
      getOrganizationUses().map((group) => ({
        group: group.title,
        entries: group.organizations.map((org) => ({
          name: org.name,
          sentence: org.use.description,
          sources: org.use.sources.map((source) => source.url),
        })),
      })),
    ).toMatchSnapshot();
  });

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
        sources: fc.constant<OrganizationWithUse["use"]["sources"]>([
          {
            label: "Example source",
            url: "https://example.org/source",
            publisher: "organization",
          },
        ]),
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
      within(desktopNav).getByRole("link", { name: "Who uses PolicyEngine" }),
    ).toHaveAttribute("href", "/us/users");
  });

  test.each([
    [US, "organizations"],
    [UK, "organisations"],
  ])(
    "given the %s citations page then its introduction links to that country's users page",
    (countryId, organisationsText) => {
      render(<CitationsClient countryId={countryId} />);

      expect(
        screen.getByRole("link", { name: "Who uses PolicyEngine" }),
      ).toHaveAttribute("href", `/${countryId}/users`);
      expect(
        screen.getByText(
          new RegExp(`page lists ${organisationsText} that have used`),
        ),
      ).toBeInTheDocument();
    },
  );

  test.each([US, UK])(
    "given %s then the sitemap lists its users page",
    (countryId) => {
      expect(sitemap().map((entry) => entry.url)).toContain(
        `https://www.policyengine.org/${countryId}/users`,
      );
    },
  );
});

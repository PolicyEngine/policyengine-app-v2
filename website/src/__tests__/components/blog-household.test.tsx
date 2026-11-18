import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, test, vi } from "vitest";

import {
  BlogHousehold,
  householdSummary,
  parseHouseholdSpec,
  signedPounds,
} from "@/components/blog/BlogHousehold";
import { MarkdownFormatter } from "@/components/blog/MarkdownFormatter";
import { readingTimeLabel } from "@/components/blog/chartReadingText";

const SPEC = {
  type: "household",
  title: "Household examples, 2029-30",
  changes: [
    { id: "removals", label: "Two removals" },
    { id: "nics", label: "Employer National Insurance" },
  ],
  examples: [
    {
      id: "parents",
      label: "20, living with parents",
      results: {
        removals: {
          net: [11504.33, 4543.49],
          rows: [
            {
              label: "Benefits",
              values: [11504.33, 4543.49],
              children: [
                {
                  label: "Universal Credit",
                  values: [7150.61, 4543.49],
                  children: [
                    { label: "Standard allowance", values: [4543.49, 4543.49] },
                    { label: "Health element (LCWRA)", values: [2607.12, 0] },
                  ],
                },
                {
                  label: "Personal Independence Payment",
                  values: [4353.72, 0],
                  children: [{ label: "Daily living", values: [4353.72, 0] }],
                },
              ],
            },
          ],
        },
      },
    },
    {
      id: "hospitality",
      label: "24, in hospitality",
      results: {
        removals: {
          net: [29566.45, 18622.45],
          rows: [
            { label: "Market income", values: [14380.95, 14380.95] },
            { label: "Benefits", values: [15872.57, 4928.57] },
            { label: "Taxes", values: [687.07, 687.07] },
          ],
        },
        nics: {
          net: [29566.45, 29777.75],
          rows: [
            { label: "Market income", values: [14380.95, 15033.13] },
            { label: "Benefits", values: [15872.57, 15614.3] },
            {
              label: "Taxes",
              values: [687.07, 869.68],
              children: [
                { label: "Income Tax", values: [362.19, 492.63] },
                {
                  label: "Employee National Insurance",
                  values: [144.88, 197.05],
                },
              ],
            },
          ],
        },
      },
    },
  ],
};
const DATA = JSON.stringify(SPEC);

describe("parseHouseholdSpec", () => {
  test("accepts a valid spec and rejects broken ones", () => {
    expect(parseHouseholdSpec(DATA)).not.toBeNull();
    expect(parseHouseholdSpec("{")).toBeNull();
    expect(
      parseHouseholdSpec(JSON.stringify({ ...SPEC, type: "bar" })),
    ).toBeNull();
    expect(
      parseHouseholdSpec(JSON.stringify({ ...SPEC, changes: [] })),
    ).toBeNull();
    const unknownChange = {
      ...SPEC,
      examples: [
        {
          ...SPEC.examples[0],
          results: { other: SPEC.examples[0].results.removals },
        },
      ],
    };
    expect(parseHouseholdSpec(JSON.stringify(unknownChange))).toBeNull();
    const badValues = {
      ...SPEC,
      examples: [
        { ...SPEC.examples[0], results: { removals: { net: [1], rows: [] } } },
      ],
    };
    expect(parseHouseholdSpec(JSON.stringify(badValues))).toBeNull();
  });

  test("an invalid spec renders nothing", () => {
    const { container } = render(<BlogHousehold data="not json" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("householdSummary and signedPounds", () => {
  test("names both parts when neither moves two-thirds of the group", () => {
    expect(householdSummary(SPEC.examples[0].results.removals as never)).toBe(
      "Benefits fall by £6,961 a year: Personal Independence Payment £4,354 and Universal Credit £2,607. Net income falls by £6,961 a year.",
    );
  });
  test("lists the unchanged groups", () => {
    const text = householdSummary(SPEC.examples[1].results.removals as never);
    expect(text).toBe(
      "Benefits fall by £10,944 a year; market income and taxes are unchanged. Net income falls by £10,944 a year.",
    );
  });
  test("agrees verbs with singular and plural groups", () => {
    const text = householdSummary(SPEC.examples[1].results.nics as never);
    expect(text).toBe(
      "Market income rises by £652 a year; benefits fall by £258 a year; taxes rise by £183 a year, mostly Income Tax. Net income rises by £211 a year.",
    );
    const oneStill = {
      net: [100, 50],
      rows: [
        { label: "Benefits", values: [100, 50] },
        { label: "Taxes", values: [10, 10] },
      ],
    };
    expect(householdSummary(oneStill as never)).toBe(
      "Benefits fall by £50 a year; taxes are unchanged. Net income falls by £50 a year.",
    );
    const incomeStill = {
      net: [100, 50],
      rows: [
        { label: "Market income", values: [10, 10] },
        { label: "Benefits", values: [100, 50] },
      ],
    };
    expect(householdSummary(incomeStill as never)).toContain(
      "market income is unchanged",
    );
  });

  test("no change is a dash", () => {
    expect(signedPounds(0.4)).toBe("—");
    expect(signedPounds(-6960.84)).toBe("−£6,961");
    expect(signedPounds(1158)).toBe("+£1,158");
  });
});

describe("BlogHousehold", () => {
  beforeAll(() => {
    // jsdom has no matchMedia; the formatter's display-category hook reads it.
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  test("labelled selects, the first example and change, and a net income row", () => {
    render(<BlogHousehold data={DATA} />);
    const household = screen.getByLabelText("Household") as HTMLSelectElement;
    const change = screen.getByLabelText("Change") as HTMLSelectElement;
    expect(household.value).toBe("parents");
    expect([...change.options].map((o) => o.textContent)).toEqual([
      "Two removals",
    ]);
    const net = screen
      .getByRole("rowheader", { name: "Net income" })
      .closest("tr")!;
    expect(within(net).getByText("−£6,961")).toBeInTheDocument();
    expect(screen.getByText("Health element (LCWRA)")).toBeInTheDocument();
  });

  test("switching example lists only its changes, and taxes rising read as a loss", () => {
    render(<BlogHousehold data={DATA} />);
    fireEvent.change(screen.getByLabelText("Household"), {
      target: { value: "hospitality" },
    });
    const change = screen.getByLabelText("Change") as HTMLSelectElement;
    expect([...change.options].map((o) => o.value)).toEqual([
      "removals",
      "nics",
    ]);
    fireEvent.change(change, { target: { value: "nics" } });
    const taxes = screen.getByRole("button", { name: /Taxes/ }).closest("tr")!;
    const cell = within(taxes).getByText("+£183");
    expect(cell.getAttribute("style")).toContain("color-error");
    const net = screen
      .getByRole("rowheader", { name: "Net income" })
      .closest("tr")!;
    expect(within(net).getByText("+£211").getAttribute("style")).toContain(
      "--primary",
    );
  });

  test("rows collapse and expand from a keyboard-operable button", () => {
    render(<BlogHousehold data={DATA} />);
    const button = screen.getByRole("button", { name: /Universal Credit/ });
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Standard allowance")).toBeInTheDocument();
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Standard allowance")).toBeNull();
    fireEvent.click(button);
    expect(screen.getByText("Standard allowance")).toBeInTheDocument();
  });

  test("a ```household block in markdown renders the block, not code", async () => {
    render(<MarkdownFormatter markdown={"```household\n" + DATA + "\n```"} />);
    expect(await screen.findByLabelText("Household")).toBeInTheDocument();
    expect(screen.queryByText(/"type"/)).toBeNull();
  });

  test("reading time counts the block's title, not its JSON", () => {
    expect(readingTimeLabel("```household\n" + DATA + "\n```")).toBe(
      "1 min read",
    );
  });
});

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { MockInstance } from "vitest";

import { BlogPostGrid } from "@/app/[countryId]/research/ResearchClient";
import HomeBlogPreview from "@/components/home/HomeBlogPreview";
import type { ResearchItem } from "@/data/posts/postTransformers";

// apps.json lists a US and a UK research app under the one slug "marriage".
// Both are tagged "global" here so that the home preview keeps both.
function marriageApp(countryId: "us" | "uk"): ResearchItem {
  return {
    title: `Marriage incentive calculator (${countryId.toUpperCase()})`,
    description: `How marriage changes taxes and benefits in the ${countryId.toUpperCase()}.`,
    date: "2025-06-01",
    authors: ["max-ghenis"],
    tags: ["global"],
    image: "",
    slug: "marriage",
    isApp: true,
    countryId,
  };
}

const US_APP = marriageApp("us");
const UK_APP = marriageApp("uk");

vi.mock("@/data/posts/postTransformers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/data/posts/postTransformers")>()),
  getResearchItems: () => [US_APP, UK_APP],
}));

let consoleError: MockInstance<typeof console.error>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** React's warnings about sibling elements that share a key. */
function duplicateKeyWarnings(): string[] {
  return consoleError.mock.calls
    .map((args) => args.map(String).join(" "))
    .filter((message) => message.includes("same key"));
}

function cardLink(href: string): HTMLElement {
  return screen
    .getAllByRole("link")
    .find((link) => link.getAttribute("href") === href)!;
}

describe("research grid card keys", () => {
  test("given apps with one slug in two countries then both cards render without a key warning", () => {
    render(<BlogPostGrid items={[US_APP, UK_APP]} countryId="us" />);

    expect(cardLink("/us/marriage")).toBeInTheDocument();
    expect(cardLink("/uk/marriage")).toBeInTheDocument();
    expect(duplicateKeyWarnings()).toEqual([]);
  });

  test("given the UK app joins the US app then only the UK card plays the enter animation", () => {
    const { rerender } = render(
      <BlogPostGrid items={[US_APP]} countryId="us" />,
    );

    rerender(<BlogPostGrid items={[US_APP, UK_APP]} countryId="us" />);

    const animation = (href: string) =>
      cardLink(href).parentElement!.style.animation;
    expect(animation("/uk/marriage")).toContain("cardEnter");
    expect(animation("/us/marriage")).toBe("");
  });
});

describe("home research preview card keys", () => {
  test("given apps with one slug in two countries then both cards render without a key warning", () => {
    render(<HomeBlogPreview countryId="us" />);

    expect(cardLink("/us/marriage")).toBeInTheDocument();
    expect(cardLink("/uk/marriage")).toBeInTheDocument();
    expect(duplicateKeyWarnings()).toEqual([]);
  });
});

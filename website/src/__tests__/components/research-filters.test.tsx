import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ResearchFilters } from "@/app/[countryId]/research/ResearchClient";

const noop = () => {};

const authors = Array.from({ length: 20 }, (_, index) => ({
  key: `author-${index}`,
  name: `Author ${index}`,
}));

function renderFilters() {
  return render(
    <ResearchFilters
      searchQuery=""
      onSearchChange={noop}
      onSearchSubmit={noop}
      selectedTopics={[]}
      onTopicsChange={noop}
      selectedLocations={[]}
      onLocationsChange={noop}
      selectedAuthors={[]}
      onAuthorsChange={noop}
      selectedTypes={[]}
      onTypesChange={noop}
      availableAuthors={authors}
      countryId="us"
    />,
  );
}

describe("ResearchFilters", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 700,
      writable: true,
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 100,
      width: 0,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("bounds a long expanded section and scrolls its contents", async () => {
    renderFilters();

    const authorHeader = screen.getByRole("button", { name: "Author" });
    fireEvent.click(authorHeader);

    const authorSection = authorHeader.parentElement;
    const filterStack = authorSection?.parentElement;
    const authorContent = authorHeader.nextElementSibling;

    expect(authorSection).toHaveStyle({
      display: "flex",
      flexDirection: "column",
      flexShrink: "1",
      minHeight: "0",
    });
    expect(authorContent).toHaveStyle({
      flex: "1 1 auto",
      minHeight: "0",
      overflowY: "auto",
    });
    await waitFor(() =>
      expect(filterStack).toHaveStyle({ maxHeight: "580px" }),
    );

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 600,
      writable: true,
    });
    fireEvent(window, new Event("resize"));

    await waitFor(() =>
      expect(filterStack).toHaveStyle({ maxHeight: "480px" }),
    );
  });

  test("keeps collapsed section headers from shrinking", () => {
    renderFilters();

    fireEvent.click(screen.getByRole("button", { name: "Author" }));

    const typeSection = screen.getByRole("button", {
      name: "Type",
    }).parentElement;
    expect(typeSection).toHaveStyle({ flexShrink: "0" });
  });
});

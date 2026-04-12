import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/us/research"),
  useRouter: vi.fn(() => ({ replace: replaceMock })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/components/blog/useDisplayCategory", () => ({
  useDisplayCategory: vi.fn(() => "desktop"),
}));

vi.mock("@/hooks/useInfiniteScroll", () => ({
  useInfiniteScroll: vi.fn(() => ({
    visibleCount: 8,
    sentinelRef: { current: null },
    hasMore: false,
    reset: vi.fn(),
  })),
}));

import ResearchClient from "@/app/[countryId]/research/ResearchClient";

describe("ResearchClient", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  test("exposes labeled filter checkboxes and updates the query string when toggled", async () => {
    render(<ResearchClient countryId="us" />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalled();
    });
    replaceMock.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Type" }));

    const articleCheckbox = screen.getByRole("checkbox", { name: "Article" });
    expect(articleCheckbox).toBeInTheDocument();

    fireEvent.click(articleCheckbox);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        expect.stringContaining("types=article"),
        { scroll: false },
      );
    });
  });
});

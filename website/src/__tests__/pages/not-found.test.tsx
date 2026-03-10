import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import NotFound from "../../app/not-found";

describe("NotFound", () => {
  test("renders page not found heading", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /page not found/i,
    );
  });
});

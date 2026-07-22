import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import OptimisedImage from "../../components/ui/OptimisedImage";

describe("OptimisedImage", () => {
  // Regression test for the production incident where the 2x srcSet variant
  // of the 250px team headshots requested w=512, which the optimizer rejected
  // with 400 because next.config.ts declared no images allowlist and Next's
  // defaults lack 512 — breaking every headshot on retina displays.
  test("snaps a 250px image to w=256 with a w=512 2x variant", () => {
    render(
      <OptimisedImage
        src="/assets/team/max-ghenis.webp"
        width={250}
        alt="Max Ghenis"
      />,
    );

    const img = screen.getByAltText("Max Ghenis");
    expect(img).toHaveAttribute(
      "src",
      "/_vercel/image?url=%2Fassets%2Fteam%2Fmax-ghenis.webp&q=80&w=256",
    );
    expect(img).toHaveAttribute(
      "srcset",
      "/_vercel/image?url=%2Fassets%2Fteam%2Fmax-ghenis.webp&q=80&w=256 1x, " +
        "/_vercel/image?url=%2Fassets%2Fteam%2Fmax-ghenis.webp&q=80&w=512 2x",
    );
  });

  test("serves external and SVG sources unoptimised", () => {
    render(
      <OptimisedImage
        src="https://example.com/photo.jpg"
        width={250}
        alt="external"
      />,
    );
    render(<OptimisedImage src="/assets/logo.svg" width={100} alt="svg" />);

    expect(screen.getByAltText("external")).toHaveAttribute(
      "src",
      "https://example.com/photo.jpg",
    );
    expect(screen.getByAltText("svg")).toHaveAttribute(
      "src",
      "/assets/logo.svg",
    );
  });
});

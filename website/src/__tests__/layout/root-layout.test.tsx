import { describe, expect, test } from "vitest";
import { metadata } from "../../app/layout";

const SOCIAL_PREVIEW_IMAGE = "/assets/policyengine-social-preview.png";

describe("RootLayout metadata", () => {
  test("includes default social preview metadata", () => {
    expect(metadata.openGraph).toEqual(
      expect.objectContaining({
        title: "PolicyEngine",
        description: metadata.description,
        siteName: "PolicyEngine",
        type: "website",
        images: [
          {
            url: SOCIAL_PREVIEW_IMAGE,
            width: 1200,
            height: 630,
            alt: "PolicyEngine",
          },
        ],
      }),
    );

    expect(metadata.twitter).toEqual(
      expect.objectContaining({
        card: "summary_large_image",
        site: "@ThePolicyEngine",
        title: "PolicyEngine",
        description: metadata.description,
        images: [
          {
            url: SOCIAL_PREVIEW_IMAGE,
            alt: "PolicyEngine",
          },
        ],
      }),
    );
  });
});

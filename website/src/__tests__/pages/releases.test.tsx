import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import ReleasePage, {
  generateMetadata,
} from "../../app/releases/[version]/page";

describe("ReleasePage", () => {
  test("renders the canonical PolicyEngine release identity", async () => {
    const page = await ReleasePage({
      params: Promise.resolve({ version: "3.4.3" }),
    });

    render(page);

    expect(
      screen.getByRole("heading", { name: "PolicyEngine v3.4.3" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/cite results from this stack/i)).toHaveTextContent(
      "PolicyEngine v3.4.3",
    );
  });

  test("links to source package and bundled release manifests", async () => {
    const page = await ReleasePage({
      params: Promise.resolve({ version: "v3.4.3" }),
    });

    render(page);

    expect(
      screen.getByRole("link", { name: /github release/i }),
    ).toHaveAttribute(
      "href",
      "https://github.com/PolicyEngine/policyengine.py/releases/tag/3.4.3",
    );
    expect(screen.getByRole("link", { name: /pypi package/i })).toHaveAttribute(
      "href",
      "https://pypi.org/project/policyengine/3.4.3/",
    );
    expect(
      screen.getByRole("link", { name: /us release manifest/i }),
    ).toHaveAttribute(
      "href",
      "https://raw.githubusercontent.com/PolicyEngine/policyengine.py/3.4.3/src/policyengine/data/release_manifests/us.json",
    );
    expect(
      screen.getByRole("link", { name: /uk release manifest/i }),
    ).toHaveAttribute(
      "href",
      "https://raw.githubusercontent.com/PolicyEngine/policyengine.py/3.4.3/src/policyengine/data/release_manifests/uk.json",
    );
  });

  test("generates release-specific metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ version: "v3.4.3" }),
    });

    expect(metadata.title).toBe("PolicyEngine v3.4.3");
    expect(metadata.description).toContain("PolicyEngine v3.4.3");
  });
});

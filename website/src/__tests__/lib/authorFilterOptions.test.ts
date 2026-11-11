import { describe, expect, test } from "vitest";

import { buildAuthorFilterOptions } from "@/lib/authorFilterOptions";

describe("buildAuthorFilterOptions", () => {
  test("formats and sorts author labels by last name", () => {
    const authors = {
      "nikhil-woodruff": { name: "Nikhil Woodruff" },
      "max-ghenis": { name: "Max Ghenis" },
      "ana-maria-lopez": { name: "Ana Maria Lopez" },
      "jason-debacker": { name: "Jason DeBacker" },
    };

    expect(buildAuthorFilterOptions(authors)).toEqual([
      { key: "jason-debacker", name: "DeBacker, Jason" },
      { key: "max-ghenis", name: "Ghenis, Max" },
      { key: "ana-maria-lopez", name: "Lopez, Ana Maria" },
      { key: "nikhil-woodruff", name: "Woodruff, Nikhil" },
    ]);
  });

  test("keeps a single-token author name unchanged", () => {
    expect(
      buildAuthorFilterOptions({ "chat-gpt": { name: "ChatGPT" } }),
    ).toEqual([{ key: "chat-gpt", name: "ChatGPT" }]);
  });
});

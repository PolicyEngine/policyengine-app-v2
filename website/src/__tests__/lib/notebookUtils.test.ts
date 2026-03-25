import { describe, expect, test } from "vitest";
import {
  extractMarkdownFromNotebook,
  isNotebookFile,
  decode,
  recursivelyDecode,
  extractFootnoteDefinitions,
  hasFootnoteReferences,
} from "../../lib/notebookUtils";
import type { Notebook } from "../../types/blog";

describe("isNotebookFile", () => {
  test("returns true for .ipynb files", () => {
    expect(isNotebookFile("article.ipynb")).toBe(true);
  });

  test("returns false for .md files", () => {
    expect(isNotebookFile("article.md")).toBe(false);
  });

  test("returns false for other extensions", () => {
    expect(isNotebookFile("article.txt")).toBe(false);
  });
});

describe("extractMarkdownFromNotebook", () => {
  test("extracts markdown cells", () => {
    const notebook: Notebook = {
      cells: [
        { cell_type: "markdown", source: ["# Title\n", "Paragraph"] },
        { cell_type: "code", source: ["print('hello')"] },
        { cell_type: "markdown", source: ["## Section"] },
      ],
    };
    const result = extractMarkdownFromNotebook(notebook);
    expect(result).toBe("# Title\nParagraph\n## Section");
  });

  test("returns empty string for code-only notebooks", () => {
    const notebook: Notebook = {
      cells: [{ cell_type: "code", source: ["x = 1"] }],
    };
    expect(extractMarkdownFromNotebook(notebook)).toBe("");
  });

  test("handles empty cells array", () => {
    const notebook: Notebook = { cells: [] };
    expect(extractMarkdownFromNotebook(notebook)).toBe("");
  });
});

describe("decode", () => {
  test("decodes pound sign", () => {
    expect(decode("\\u00a3100")).toBe("£100");
  });

  test("leaves other text unchanged", () => {
    expect(decode("hello world")).toBe("hello world");
  });
});

describe("recursivelyDecode", () => {
  test("decodes strings", () => {
    expect(recursivelyDecode("\\u00a3")).toBe("£");
  });

  test("decodes arrays", () => {
    expect(recursivelyDecode(["\\u00a3", "hello"])).toEqual(["£", "hello"]);
  });

  test("decodes objects", () => {
    expect(recursivelyDecode({ price: "\\u00a350" })).toEqual({
      price: "£50",
    });
  });

  test("handles null", () => {
    expect(recursivelyDecode(null)).toBeNull();
  });

  test("handles numbers", () => {
    expect(recursivelyDecode(42)).toBe(42);
  });
});

describe("extractFootnoteDefinitions", () => {
  test("extracts footnotes", () => {
    const md = "[^1]: First note\n[^2]: Second note";
    const result = extractFootnoteDefinitions(md);
    expect(result).toEqual({ "1": "First note", "2": "Second note" });
  });

  test("returns empty object for no footnotes", () => {
    expect(extractFootnoteDefinitions("No footnotes here")).toEqual({});
  });
});

describe("hasFootnoteReferences", () => {
  test("detects footnote references", () => {
    expect(hasFootnoteReferences("See[^1] for details")).toBe(true);
  });

  test("ignores footnote definitions", () => {
    expect(hasFootnoteReferences("[^1]: This is a definition")).toBe(false);
  });

  test("returns false with no footnotes", () => {
    expect(hasFootnoteReferences("Plain text")).toBe(false);
  });
});

import fc from "fast-check";
import { describe, expect, test } from "vitest";

import {
  INDEX_RECENT_COUNT,
  RECENT_ARCHIVE_COUNT,
  SITE_URL,
  articleToLlmsMarkdown,
  buildLlmsFile,
  describeIframe,
  notebookToMarkdown,
  postUrl,
  summarizePlotlyFigure,
  transformArticleMarkdown,
  type LlmsPost,
  type LlmsSource,
} from "@/lib/llmsTxt";
import type { Notebook } from "@/types/blog";

const CHART_LINE = /^\[Chart: [^\n]*\]$/;
const CODE_FENCE = /^[ \t]*```[^\n]*\n[\s\S]*?^[ \t]*```[ \t]*\r?$/gm;

function outsideFences(text: string): string {
  return text.replace(CODE_FENCE, "");
}

function urlLines(text: string): string[] {
  return [...text.matchAll(/^URL: (.+)$/gm)].map((m) => m[1]);
}

/** Article blocks, each from its opening "---" to the next one. */
function articleBlocks(text: string): string[] {
  return text.split(/^(?=---\n# )/m).slice(1);
}

describe("summarizePlotlyFigure", () => {
  test("given title, axes, types and names then all appear in one line", () => {
    // Given
    const figure = {
      data: [
        { type: "bar", name: "Reform" },
        { type: "scatter", name: "Baseline" },
      ],
      layout: {
        title: { text: "Net income<br>by decile" },
        xaxis: { title: { text: "Income decile" } },
        yaxis: { title: "Change (<b>£</b>)" },
      },
    };

    // When
    const summary = summarizePlotlyFigure(figure);

    // Then
    expect(summary).toBe(
      "[Chart: Net income by decile; x-axis: Income decile; y-axis: Change (£); type: bar, scatter; series: Reform, Baseline]",
    );
  });

  test("given more than ten series then the rest are counted", () => {
    const data = Array.from({ length: 13 }, (_, i) => ({ name: `S${i}` }));

    const summary = summarizePlotlyFigure({ data });

    expect(summary).toContain("S9 and 3 more]");
    expect(summary).not.toContain("S10");
  });

  test("given nothing to describe then it points to the article", () => {
    expect(summarizePlotlyFigure({ data: [], layout: {} })).toBe(
      "[Chart: see the original article]",
    );
    expect(summarizePlotlyFigure(null)).toBe(
      "[Chart: see the original article]",
    );
  });

  test("given any JSON value then the summary is one well-formed line", () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        expect(summarizePlotlyFigure(value)).toMatch(CHART_LINE);
      }),
    );
  });

  test("given any figure-shaped value then its title text is kept", () => {
    const text = fc.stringMatching(
      /^[A-Za-z0-9][A-Za-z0-9 ]{0,20}[A-Za-z0-9]$/,
    );
    fc.assert(
      fc.property(text, fc.boolean(), (title, wrapped) => {
        const summary = summarizePlotlyFigure({
          layout: { title: wrapped ? { text: title } : title },
        });
        expect(summary).toMatch(CHART_LINE);
        expect(summary).toContain(title.replace(/\s+/g, " "));
      }),
    );
  });
});

describe("describeIframe", () => {
  // The Vite generator's iframe pattern never captured title= (a greedy
  // [^>]* ran past it), so every embed was named from its URL.
  test("given a title after src then the title names the embed", () => {
    expect(
      describeIframe(
        ' src="https://example.org/a.html" title="Budget scenarios"',
      ),
    ).toBe("[Interactive: Budget scenarios](https://example.org/a.html)");
  });

  test("given no title then the embed is named from its URL", () => {
    expect(
      describeIframe(' width="100%" src="https://e.org/embed-budget.html?x=1"'),
    ).toBe("[Interactive: embed budget](https://e.org/embed-budget.html?x=1)");
  });

  test("given a site-relative src then the link is absolute", () => {
    expect(describeIframe(' src="/us/tool"')).toBe(
      `[Interactive: tool](${SITE_URL}/us/tool)`,
    );
  });

  test("given data-src only then it is not mistaken for src", () => {
    expect(describeIframe(' data-src="https://e.org/x.html"')).toBe(
      "[Interactive: see the original article]",
    );
  });
});

describe("transformArticleMarkdown", () => {
  test("given a captioned plotly block then the caption stays and the JSON goes", () => {
    // Given
    const markdown = [
      "**Figure 2: Relative change by decile**",
      "",
      "```plotly",
      '{"data":[{"type":"bar"}],"layout":{"xaxis":{"title":{"text":"Decile"}}}}',
      "```",
      "",
      "Next paragraph.",
    ].join("\n");

    // When
    const result = transformArticleMarkdown(markdown);

    // Then
    expect(result).toBe(
      [
        "**Figure 2: Relative change by decile**",
        "",
        "[Chart: x-axis: Decile; type: bar]",
        "",
        "Next paragraph.",
      ].join("\n"),
    );
  });

  test("given an unparseable plotly block then it still becomes a summary", () => {
    expect(transformArticleMarkdown("```plotly\n{not json\n```")).toBe(
      "[Chart: see the original article]",
    );
  });

  test("given scripts, iframes and relative links then each is rewritten", () => {
    // Given
    const markdown = [
      '<blockquote class="twitter-tweet"><p>Hi</p></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>',
      '<iframe src="https://e.org/chart.html" width="100%"></iframe>',
      "See [the post](/us/research/x) and ![a chart](/assets/posts/x.png).",
      '<img src="/assets/a.png" alt="a"> <a href="/uk">UK</a>',
      "[ref]: /us/research/y",
      "Absolute [links](https://e.org/a) and [protocol-relative](//e.org/b) stay.",
    ].join("\n");

    // When
    const result = transformArticleMarkdown(markdown);

    // Then
    expect(result).not.toContain("<script");
    expect(result).toContain("<p>Hi</p></blockquote>");
    expect(result).toContain("[Interactive: chart](https://e.org/chart.html)");
    expect(result).toContain(`[the post](${SITE_URL}/us/research/x)`);
    expect(result).toContain(`![a chart](${SITE_URL}/assets/posts/x.png)`);
    expect(result).toContain(`<img src="${SITE_URL}/assets/a.png"`);
    expect(result).toContain(`<a href="${SITE_URL}/uk">`);
    expect(result).toContain(`[ref]: ${SITE_URL}/us/research/y`);
    expect(result).toContain("[links](https://e.org/a)");
    expect(result).toContain("[protocol-relative](//e.org/b)");
  });

  test("given code fences then their contents are left as written", () => {
    const fence = '```html\n<iframe src="/x"></iframe> [a](/b)\n```';

    const result = transformArticleMarkdown(`Text [a](/b)\n\n${fence}\n`);

    expect(result).toContain(fence);
    expect(result).toContain(`Text [a](${SITE_URL}/b)`);
  });

  test("given a chart block then its JSON data is kept", () => {
    const chart = '```chart\n{"type":"bar","title":"T","data":[]}\n```';

    expect(transformArticleMarkdown(chart)).toBe(chart);
  });

  const word = fc.stringMatching(/^[A-Za-z0-9]{1,8}$/);
  const prose = fc
    .array(word, { minLength: 1, maxLength: 8 })
    .map((words) => words.join(" "));
  const plotlyFence = fc
    .jsonValue()
    .map((value) => "```plotly\n" + JSON.stringify(value) + "\n```");

  test("given prose and plotly blocks then prose is kept and each block is one summary", () => {
    const part = fc.oneof(
      prose.map((text) => ({ fence: false, text })),
      plotlyFence.map((text) => ({ fence: true, text })),
    );
    fc.assert(
      fc.property(fc.array(part, { maxLength: 10 }), (parts) => {
        const result = transformArticleMarkdown(
          parts.map((p) => p.text).join("\n\n"),
        );

        expect(result).not.toContain("```plotly");
        const summaries = result
          .split("\n")
          .filter((line) => line.startsWith("[Chart: "));
        expect(summaries.length).toBe(parts.filter((p) => p.fence).length);
        for (const line of summaries) expect(line).toMatch(CHART_LINE);
        for (const p of parts.filter((p) => !p.fence)) {
          expect(result).toContain(p.text);
        }
      }),
    );
  });

  // Blocks in the shapes the articles use.
  const block = fc.oneof(
    prose,
    word.map((w) => `[${w}](/us/research/${w.toLowerCase()})`),
    word.map((w) => `![${w}](/assets/posts/${w}.png)`),
    word.map((w) => `<img src="/assets/${w}.png" alt="${w}">`),
    word.map((w) => `[${w}]: /uk/research/${w.toLowerCase()}`),
    word.map((w) => `<iframe src="/embed/${w}.html" title="${w}"></iframe>`),
    word.map((w) => `<iframe src="https://e.org/${w}-x.html"></iframe>`),
    word.map((w) => `<iframe src="https://e.org/${w}" />`),
    word.map((w) => `<script async src="https://e.org/${w}.js"></script>`),
    word.map((w) => "```python\nprint('[" + w + "](/x)')\n```"),
    plotlyFence,
  );
  const articleMarkdown = fc
    .array(block, { maxLength: 12 })
    .map((blocks) => blocks.join("\n\n"));

  test("given article-shaped markdown then rewriting it again changes nothing", () => {
    fc.assert(
      fc.property(articleMarkdown, (markdown) => {
        const once = transformArticleMarkdown(markdown);
        expect(transformArticleMarkdown(once)).toBe(once);
      }),
    );
  });

  test("given article-shaped markdown then no embed or relative link survives outside code", () => {
    fc.assert(
      fc.property(articleMarkdown, (markdown) => {
        const text = outsideFences(transformArticleMarkdown(markdown));
        expect(text).not.toMatch(/<iframe|<script|```plotly/i);
        expect(text).not.toMatch(/\]\(\/(?!\/)/);
        expect(text).not.toMatch(/\s(?:src|href)="\/(?!\/)/);
        expect(text).not.toMatch(/^\[[^\]]+\]: \/(?!\/)/m);
      }),
    );
  });

  test("given code fences then they come through byte for byte", () => {
    fc.assert(
      fc.property(articleMarkdown, (markdown) => {
        const fences = [...markdown.matchAll(CODE_FENCE)]
          .map((m) => m[0])
          .filter((f) => !f.trimStart().startsWith("```plotly"));
        const result = transformArticleMarkdown(markdown);
        for (const fence of fences) expect(result).toContain(fence);
      }),
    );
  });
});

describe("notebookToMarkdown", () => {
  const notebook: Notebook = {
    cells: [
      { cell_type: "markdown", source: ["## Results\n", "Revenue falls."] },
      { cell_type: "code", source: ["fig.show()"], outputs: [] },
      {
        cell_type: "code",
        source: ["fig"],
        outputs: [
          {
            data: {
              "application/vnd.plotly.v1+json": {
                data: [{ type: "bar" }],
                layout: { title: { text: "Winners by decile" } },
              },
            },
          },
        ],
      },
      {
        cell_type: "code",
        source: ["Markdown(table)"],
        outputs: [
          {
            data: {
              "text/markdown": ["| a | b |\n", "|---|---|\n", "| 1 | 2 |"],
              "text/plain": ["<IPython.core.display.Markdown object>"],
            },
          },
        ],
      },
      {
        cell_type: "code",
        source: ["Markdown(chart)"],
        outputs: [
          {
            data: {
              "text/markdown": [
                "```plotly\n",
                '{"layout":{"title":{"text":"From markdown"}}}\n',
                "```",
              ],
            },
          },
        ],
      },
      {
        cell_type: "code",
        source: ["df"],
        outputs: [
          { data: { "text/html": "<table></table>", "text/plain": "df" } },
        ],
      },
      {
        cell_type: "code",
        source: ["fig.to_json()"],
        outputs: [
          {
            data: {
              "text/plain": [
                '\'{"data":[{"type":"scatter","name":"\\\\u00a3200/month"}],"layout":{}}\'',
              ],
            },
          },
        ],
      },
      {
        cell_type: "code",
        source: ["ratio"],
        outputs: [{ data: { "text/plain": ["1.025"] } }],
      },
      {
        cell_type: "code",
        source: ["print('x')"],
        outputs: [{ output_type: "stream" }],
      },
      {
        // The article page renders only a code cell's first output.
        cell_type: "code",
        source: ["display(note); fig"],
        outputs: [
          { data: { "text/markdown": "Only the first output." } },
          {
            data: {
              "application/vnd.plotly.v1+json": {
                layout: { title: "Second output" },
              },
            },
          },
        ],
      },
    ],
  };

  test("given a notebook then it reads like the rendered article", () => {
    expect(notebookToMarkdown(notebook)).toBe(
      [
        "## Results\nRevenue falls.",
        "[Chart: Winners by decile; type: bar]",
        "| a | b |\n|---|---|\n| 1 | 2 |",
        '```plotly\n{"layout":{"title":{"text":"From markdown"}}}\n```',
        "[Chart: type: scatter; series: £200/month]",
        "1.025",
        "Only the first output.",
      ].join("\n\n"),
    );
  });

  test("given a notebook file then plotly in markdown outputs is summarised too", () => {
    const result = articleToLlmsMarkdown(
      "example.ipynb",
      JSON.stringify(notebook),
    );

    expect(result).toContain("[Chart: From markdown]");
    expect(result).not.toContain("```plotly");
    expect(result).not.toContain("cell_type");
    expect(result).not.toContain("fig.show()");
  });
});

describe("buildLlmsFile with generated posts", () => {
  const countryTags = ["us", "uk", "ca", "ng", "global", "tax"];
  const date = fc
    .record({
      day: fc.date({
        min: new Date("2016-01-01T00:00:00Z"),
        max: new Date("2030-12-31T00:00:00Z"),
        noInvalidDate: true,
      }),
      time: fc.option(fc.constantFrom("08:00:00", "12:00", "18:41:01")),
    })
    .map(
      ({ day, time }) =>
        day.toISOString().slice(0, 10) + (time === null ? "" : ` ${time}`),
    );
  // Any code points, line breaks and lone surrogates included.
  const text = fc.string({ unit: "binary", maxLength: 30 });
  const post = fc.record({
    slug: fc.stringMatching(/^[a-z][a-z0-9-]{0,12}$/),
    date,
    tags: fc.shuffledSubarray(countryTags),
    title: text,
    description: text,
    authors: fc.subarray(["ada", "grace", "unknown-id"]),
    body: fc.stringMatching(/^[A-Za-z0-9 ]{1,40}$/),
  });
  const postList = fc.uniqueArray(post, {
    selector: (p) => p.slug,
    maxLength: RECENT_ARCHIVE_COUNT + 12,
  });

  function sourceFor(
    generated: Array<{ body: string } & Omit<LlmsPost, "filename">>,
  ): LlmsSource {
    const bodies = new Map(generated.map((p) => [`${p.slug}.md`, p.body]));
    return {
      posts: generated.map((p) => ({
        title: p.title,
        description: p.description,
        date: p.date,
        authors: p.authors,
        tags: p.tags,
        slug: p.slug,
        filename: `${p.slug}.md`,
      })),
      authors: {
        ada: { name: "Ada Lovelace" },
        grace: { name: "Grace Hopper" },
      },
      loadArticle: (filename) => bodies.get(filename) ?? "",
    };
  }

  const params = { numRuns: 60 };

  test("given any posts then the full archive has each post once, newest first", () => {
    fc.assert(
      fc.property(postList, (generated) => {
        const source = sourceFor(generated);
        const full = buildLlmsFile("llms-full.txt", source);
        const urls = urlLines(full);

        expect([...urls].sort()).toEqual(generated.map(postUrl).sort());
        const byUrl = new Map(generated.map((p) => [postUrl(p), p]));
        const dates = urls.map((url) => byUrl.get(url)!.date);
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i] <= dates[i - 1]).toBe(true);
          // Equal dates keep their source order.
          if (dates[i] === dates[i - 1]) {
            const order = (url: string) =>
              generated.findIndex((p) => postUrl(p) === url);
            expect(order(urls[i])).toBeGreaterThan(order(urls[i - 1]));
          }
        }
        expect(articleBlocks(full)).toHaveLength(generated.length);
      }),
      params,
    );
  });

  test("given any posts then each country file holds exactly its tagged posts", () => {
    fc.assert(
      fc.property(postList, (generated) => {
        const source = sourceFor(generated);
        for (const country of ["us", "uk"] as const) {
          const file = buildLlmsFile(`llms-research-${country}.txt`, source);
          const expected = generated
            .filter((p) => p.tags.includes(country))
            .map(postUrl);
          expect([...urlLines(file)].sort()).toEqual(expected.sort());
        }
      }),
      params,
    );
  });

  test("given any posts then the recent file is the head of the full archive", () => {
    fc.assert(
      fc.property(postList, (generated) => {
        const source = sourceFor(generated);
        const full = articleBlocks(buildLlmsFile("llms-full.txt", source));
        const recent = articleBlocks(buildLlmsFile("llms-recent.txt", source));

        expect(recent).toEqual(
          full.slice(0, Math.min(RECENT_ARCHIVE_COUNT, generated.length)),
        );
      }),
      params,
    );
  });

  test("given any posts then the index lists the newest and counts each file", () => {
    fc.assert(
      fc.property(postList, (generated) => {
        const source = sourceFor(generated);
        const index = buildLlmsFile("llms.txt", source);
        const fullUrls = urlLines(buildLlmsFile("llms-full.txt", source));
        const postLink = new RegExp(
          `\\]\\((${SITE_URL}/[a-z]{2}/research/[^)\\s]+)\\): `,
        );
        const listed = index
          .split("## Research by country")[0]
          .split("\n")
          .filter((line) => line.startsWith("- ["))
          .map((line) => postLink.exec(line)?.[1]);

        expect(listed).toEqual(
          fullUrls.slice(0, Math.min(INDEX_RECENT_COUNT, generated.length)),
        );
        const tagged = (c: string) =>
          generated.filter((p) => p.tags.includes(c)).length;
        expect(index).toContain(`Full text of ${tagged("us")} articles on US`);
        expect(index).toContain(`Full text of ${tagged("uk")} articles on UK`);
        expect(index).toContain(`Full text of all ${generated.length} `);
      }),
      params,
    );
  });

  test("given any titles then every index entry is a well-formed markdown link", () => {
    fc.assert(
      fc.property(postList, (generated) => {
        const index = buildLlmsFile("llms.txt", sourceFor(generated));
        const items = index
          .split("## Recent research")[1]
          .split("\n")
          .filter((line) => line.startsWith("- "));
        for (const item of items) {
          expect(item).toMatch(
            /^- \[(?:[^\]\\\n]|\\.)*\]\((?:https:|mailto:)[^)\s]+\)(?:: .*)?$/,
          );
        }
      }),
      params,
    );
  });

  test("given a title with brackets then the index escapes them", () => {
    const source = sourceFor([
      {
        slug: "draft",
        date: "2026-01-01",
        tags: ["uk"],
        title: "Budget [draft] notes",
        description: "D",
        authors: [],
        body: "Body",
      },
    ]);

    expect(buildLlmsFile("llms.txt", source)).toContain(
      `- [Budget \\[draft\\] notes](${SITE_URL}/uk/research/draft): D`,
    );
  });

  test("given a title ending in a backslash then the link still closes", () => {
    const source = sourceFor([
      {
        slug: "path",
        date: "2026-01-01",
        tags: ["us"],
        title: "Files in C:\\",
        description: "D",
        authors: [],
        body: "Body",
      },
    ]);

    expect(buildLlmsFile("llms.txt", source)).toContain(
      `- [Files in C:\\\\](${SITE_URL}/us/research/path): D`,
    );
  });

  test("given titles with line breaks then every header field stays on one line", () => {
    fc.assert(
      fc.property(postList, (generated) => {
        const full = buildLlmsFile("llms-full.txt", sourceFor(generated));
        for (const field of ["URL", "Date", "Authors", "Tags", "Description"]) {
          expect(
            full.match(new RegExp(`^${field}: `, "gm")) ?? [],
          ).toHaveLength(generated.length);
        }
      }),
      params,
    );
  });

  test("given an author id with no entry then the id is shown", () => {
    const source = sourceFor([
      {
        slug: "a",
        date: "2026-01-01",
        tags: ["us"],
        title: "A",
        description: "D",
        authors: ["ada", "unknown-id"],
        body: "Body",
      },
    ]);

    expect(buildLlmsFile("llms-full.txt", source)).toContain(
      "Authors: Ada Lovelace, unknown-id",
    );
  });
});

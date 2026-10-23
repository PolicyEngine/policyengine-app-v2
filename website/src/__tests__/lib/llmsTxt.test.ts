import fc from "fast-check";
import { describe, expect, test } from "vitest";

import {
  INDEX_RECENT_COUNT,
  RECENT_ARCHIVE_COUNT,
  CODE_FENCE,
  SITE_URL,
  absoluteUrl,
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

/** One line: no line terminator of any kind. */
const CHART_LINE = /^\[Chart: [^\n\r\v\f\u0085\u2028\u2029]*\]$/;
const LINE_BREAK = /[\n\r\v\f\u0085\u2028\u2029]/;
const ARTICLE_URL = `${SITE_URL}/us/research/an-article`;

function outsideFences(text: string): string {
  return text.replace(CODE_FENCE, "");
}

describe("absoluteUrl", () => {
  test("given each kind of target then it resolves as a browser would", () => {
    expect(absoluteUrl("/us/x")).toBe(`${SITE_URL}/us/x`);
    expect(absoluteUrl("next", ARTICLE_URL)).toBe(
      `${SITE_URL}/us/research/next`,
    );
    expect(absoluteUrl("../calc", ARTICLE_URL)).toBe(`${SITE_URL}/us/calc`);
    expect(absoluteUrl("#part", ARTICLE_URL)).toBe("#part");
    expect(absoluteUrl("//e.org/x")).toBe("//e.org/x");
    expect(absoluteUrl("https://e.org/a b")).toBe("https://e.org/a b");
    expect(absoluteUrl("mailto:a@b.org")).toBe("mailto:a@b.org");
  });
});

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

  test("given figure-shaped values with any strings then the summary is one line", () => {
    // Any code points, line breaks included, in every field the summary reads.
    const anyText = fc.string({ unit: "binary", maxLength: 20 });
    const titled = fc.oneof(
      anyText,
      anyText.map((text) => ({ text })),
    );
    const figure = fc.record({
      layout: fc.record({
        title: titled,
        xaxis: fc.record({ title: titled }),
        yaxis: fc.record({ title: titled }),
      }),
      data: fc.array(fc.record({ type: anyText, name: titled }), {
        maxLength: 14,
      }),
    });
    fc.assert(
      fc.property(figure, (value) => {
        expect(summarizePlotlyFigure(value)).toMatch(CHART_LINE);
      }),
    );
  });

  test("given a trace type or title with a line break then it is joined", () => {
    expect(
      summarizePlotlyFigure({
        layout: { title: "A\u0085B" },
        data: [{ type: "bar\nscatter" }],
      }),
    ).toBe("[Chart: A B; type: bar scatter]");
  });

  test("given an escaped pound sign in a series name then it is decoded", () => {
    expect(
      summarizePlotlyFigure({ data: [{ name: "\\u00a3200/month" }] }),
    ).toBe("[Chart: series: £200/month]");
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

  test("given a title with brackets then the link text escapes them", () => {
    expect(
      describeIframe(' src="https://e.org/m.html" title="Budget [draft] map"'),
    ).toBe("[Interactive: Budget \\[draft\\] map](https://e.org/m.html)");
  });

  test("given an untitled YouTube embed then it is named as a video", () => {
    expect(
      describeIframe(' src="https://www.youtube.com/embed/_Y0EWjmHyy0"'),
    ).toBe(
      "[Interactive: YouTube video](https://www.youtube.com/embed/_Y0EWjmHyy0)",
    );
  });

  test("given youtu.be and youtube-nocookie embeds then they are videos too", () => {
    expect(describeIframe(' src="https://youtu.be/abc_DEF"')).toBe(
      "[Interactive: YouTube video](https://youtu.be/abc_DEF)",
    );
    expect(
      describeIframe(' src="https://www.youtube-nocookie.com/embed/abc"'),
    ).toBe(
      "[Interactive: YouTube video](https://www.youtube-nocookie.com/embed/abc)",
    );
  });

  test("given a page-relative src then it resolves against the article", () => {
    expect(describeIframe(' src="embed.html"', ARTICLE_URL)).toBe(
      `[Interactive: embed](${SITE_URL}/us/research/embed.html)`,
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

  test("given page-relative links then they resolve as on the article page", () => {
    // Given
    const markdown = [
      "See [ECPS](enhanced-cps-beta), [the calculator](../aca-calc) and [notes](#notes).",
      "![A chart](images/chart.png) <a href='other-post'>other</a>",
      "[ref]: methodology",
      "[^1]: A footnote, not a link: keep it as written.",
      "[Note]: this line is a sentence, not a definition.",
      'Write `[a](relative)` and `src="x.png"` in inline code as is.',
      "[mail](mailto:hello@policyengine.org) [site](https://e.org/x)",
    ].join("\n");

    // When
    const result = transformArticleMarkdown(markdown, ARTICLE_URL);

    // Then
    expect(result).toContain(
      `[ECPS](${SITE_URL}/us/research/enhanced-cps-beta)`,
    );
    expect(result).toContain(`[the calculator](${SITE_URL}/us/aca-calc)`);
    expect(result).toContain("[notes](#notes)");
    expect(result).toContain(
      `![A chart](${SITE_URL}/us/research/images/chart.png)`,
    );
    expect(result).toContain(`<a href='${SITE_URL}/us/research/other-post'>`);
    expect(result).toContain(`[ref]: ${SITE_URL}/us/research/methodology`);
    expect(result).toContain(
      "[^1]: A footnote, not a link: keep it as written.",
    );
    expect(result).toContain(
      "[Note]: this line is a sentence, not a definition.",
    );
    expect(result).toContain('`[a](relative)` and `src="x.png"`');
    expect(result).toContain("[mail](mailto:hello@policyengine.org)");
    expect(result).toContain("[site](https://e.org/x)");
  });

  test("given fences of other lengths and kinds then they are code too", () => {
    // Given
    const longFence =
      '````md\n```plotly\n{}\n```\n<iframe src="/x"></iframe>\n````';
    const tildeFence = "~~~\n[a](/b) <script>x()</script>\n~~~";
    const tildePlotly = '~~~plotly\n{"layout":{"title":"Tilde"}}\n~~~';

    // When
    const result = transformArticleMarkdown(
      [longFence, tildeFence, tildePlotly].join("\n\n"),
    );

    // Then
    expect(result).toContain(longFence);
    expect(result).toContain(tildeFence);
    expect(result).toContain("[Chart: Tilde]");
  });

  test("given a plotly fence with CRLF lines or extra info words then it is summarised", () => {
    const crlf = '```plotly\r\n{"layout":{"title":"CRLF"}}\r\n```\r\n';
    const titled = '```plotly Figure 1\n{"layout":{"title":"Titled"}}\n```';

    // The fence takes its closing line's CR; the LF after it stays.
    expect(transformArticleMarkdown(crlf)).toBe("[Chart: CRLF]\n");
    expect(transformArticleMarkdown(titled)).toBe("[Chart: Titled]");
    expect(
      transformArticleMarkdown(
        '``` plotly\n{"layout":{"title":"Spaced"}}\n```',
      ),
    ).toBe("[Chart: Spaced]");
  });

  test("given a backtick line with backticks in its info then it is not a fence", () => {
    // CommonMark reads "``` `a` ```" as inline code, not an opening fence.
    const markdown =
      '``` `a` ```\n\n```plotly\n{"layout":{"title":"After"}}\n```';

    const result = transformArticleMarkdown(markdown);

    expect(result).toBe("``` `a` ```\n\n[Chart: After]");
  });

  test("given a one-word footnote then it is not read as a link reference", () => {
    expect(transformArticleMarkdown("[^1]: methodology", ARTICLE_URL)).toBe(
      "[^1]: methodology",
    );
  });

  test("given an unclosed fence then the rest of the article is code", () => {
    const markdown = 'Text [a](/b)\n\n```\n[c](/d) <iframe src="/e"></iframe>';

    expect(transformArticleMarkdown(markdown)).toBe(
      `Text [a](${SITE_URL}/b)\n\n\`\`\`\n[c](/d) <iframe src="/e"></iframe>`,
    );
  });

  test("given an HTML comment then it is dropped, embeds and all", () => {
    expect(
      transformArticleMarkdown(
        'A <!-- <iframe src="https://e.org/x"></iframe> --> B',
      ),
    ).toBe("A  B");
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
    word.map((w) => "~~~\n[" + w + "](" + w + ")\n~~~"),
    word.map((w) => `[${w}](${w.toLowerCase()}-post)`),
    word.map((w) => `[${w}](../${w.toLowerCase()})`),
    word.map((w) => `![${w}](img/${w}.png)`),
    word.map((w) => `<a href="${w}.html">${w}</a>`),
    word.map((w) => `[${w}]: ${w.toLowerCase()}`),
    word.map((w) => `[${w}](#${w.toLowerCase()})`),
    word.map((w) => `<!-- ${w} <iframe src="/${w}"></iframe> -->`),
    plotlyFence,
  );
  const articleMarkdown = fc
    .array(block, { maxLength: 12 })
    .map((blocks) => blocks.join("\n\n"));

  test("given article-shaped markdown then rewriting it again changes nothing", () => {
    fc.assert(
      fc.property(articleMarkdown, (markdown) => {
        const once = transformArticleMarkdown(markdown, ARTICLE_URL);
        expect(transformArticleMarkdown(once, ARTICLE_URL)).toBe(once);
      }),
    );
  });

  test("given article-shaped markdown then no embed or relative link survives outside code", () => {
    fc.assert(
      fc.property(articleMarkdown, (markdown) => {
        const text = outsideFences(
          transformArticleMarkdown(markdown, ARTICLE_URL),
        );
        expect(text).not.toMatch(/<iframe|<script|<!--|```plotly/i);
        const targets = [
          ...[...text.matchAll(/\]\(([^)\s]+)/g)].map((m) => m[1]),
          ...[...text.matchAll(/\s(?:src|href)=["']([^"']*)/g)].map(
            (m) => m[1],
          ),
          ...[...text.matchAll(/^\[[^\]^]+\]: (\S+)/gm)].map((m) => m[1]),
        ];
        for (const target of targets) {
          expect(target).toMatch(/^(?:https:\/\/|#)/);
        }
      }),
    );
  });

  test("given code fences then they come through byte for byte", () => {
    fc.assert(
      fc.property(articleMarkdown, (markdown) => {
        const fences = [...markdown.matchAll(CODE_FENCE)]
          .filter((m) => m[3].trim() !== "plotly")
          .map((m) => m[0]);
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
        // The page renders only the first element of a text/plain array.
        cell_type: "code",
        source: ["pair"],
        outputs: [{ data: { "text/plain": ["1.5", "2.5"] } }],
      },
      {
        cell_type: "code",
        source: ["print('x')"],
        outputs: [{ output_type: "stream" }],
      },
      {
        // Not JSON: the whole output is kept, rows and all.
        cell_type: "code",
        source: ["df"],
        outputs: [
          { data: { "text/plain": ["   a  b\n", "0  1  2\n", "1  3  4"] } },
        ],
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
        "1.5",
        "```\na  b\n0  1  2\n1  3  4\n```",
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
    tags: fc
      .tuple(fc.shuffledSubarray(countryTags), fc.option(text))
      .map(([tags, extra]) => (extra === null ? tags : [...tags, extra])),
    title: text,
    description: text,
    authors: fc.subarray(["ada", "grace", "unknown-id"]),
    body: fc.stringMatching(/^[A-Za-z0-9 ]{1,40}$/),
  });
  const authorNames = fc.record({ ada: text, grace: text });
  const postList = fc.uniqueArray(post, {
    selector: (p) => p.slug,
    maxLength: RECENT_ARCHIVE_COUNT + 12,
  });

  function sourceFor(
    generated: Array<{ body: string } & Omit<LlmsPost, "filename">>,
    names: { ada: string; grace: string } = {
      ada: "Ada Lovelace",
      grace: "Grace Hopper",
    },
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
      authors: { ada: { name: names.ada }, grace: { name: names.grace } },
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
        const fullUrls = urlLines(buildLlmsFile("llms-full.txt", source));
        for (const country of ["us", "uk"] as const) {
          const file = buildLlmsFile(`llms-research-${country}.txt`, source);
          const tagged = new Set(
            generated.filter((p) => p.tags.includes(country)).map(postUrl),
          );
          // The same posts, in the full archive's order.
          expect(urlLines(file)).toEqual(fullUrls.filter((u) => tagged.has(u)));
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
        expect(index).toContain(
          `Full text of the ${Math.min(RECENT_ARCHIVE_COUNT, generated.length)} most recent articles`,
        );
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

  test("given any titles, descriptions, tags and author names then each header field is one line", () => {
    fc.assert(
      fc.property(postList, authorNames, (generated, names) => {
        const full = buildLlmsFile(
          "llms-full.txt",
          sourceFor(generated, names),
        );
        const blocks = articleBlocks(full);
        expect(blocks).toHaveLength(generated.length);
        for (const block of blocks) {
          const lines = block.split("\n");
          expect(lines[0]).toBe("---");
          expect(lines[1].startsWith("# ")).toBe(true);
          ["URL", "Date", "Authors", "Tags", "Description"].forEach(
            (field, i) =>
              expect(lines[2 + i].startsWith(`${field}: `)).toBe(true),
          );
          expect(lines[7]).toBe("---");
          expect(lines[8]).toBe("");
          for (const line of lines.slice(1, 7)) {
            expect(line).not.toMatch(LINE_BREAK);
          }
        }
      }),
      params,
    );
  });

  test("given a title with a line break then its header line joins it", () => {
    const source = sourceFor([
      {
        slug: "t",
        date: "2026-01-01",
        tags: ["us"],
        title: "Line one\nline two",
        description: "D\u2028E",
        authors: [],
        body: "Body",
      },
    ]);
    const lines = buildLlmsFile("llms-full.txt", source).split("\n");

    expect(lines).toContain("# Line one line two");
    expect(lines).toContain("Description: D E");
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

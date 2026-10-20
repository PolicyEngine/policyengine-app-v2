// @vitest-environment node
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { describe, expect, test } from "vitest";

const websiteDir = fileURLToPath(new URL("../../..", import.meta.url));

// @next/next/no-html-link-for-pages switches itself off, without failing
// lint, when settings.next.rootDir in eslint.config.mjs matches no folder.
describe("website ESLint config", () => {
  test("reports a plain <a> link to a website page", async () => {
    const eslint = new ESLint({ cwd: websiteDir });
    const [result] = await eslint.lintText(
      'export default function Probe() {\n  return <a href="/us/research">Research</a>;\n}\n',
      { filePath: `${websiteDir}src/app/probe.tsx` },
    );
    expect(result.messages.map((message) => message.ruleId)).toContain(
      "@next/next/no-html-link-for-pages",
    );
  }, 60_000);
});

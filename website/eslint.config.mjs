import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// @next/eslint-plugin-next reads settings.next.rootDir as a glob. Brackets
// make (, ), {, }, |, + and [ literal, so a parent folder named like
// "Projects (1)" doesn't stop the path matching. When rootDir matches
// nothing, @next/next/no-html-link-for-pages switches itself off without
// failing lint.
const rootDir = __dirname.replace(/[(){}|+[]/g, "[$&]");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default defineConfig([
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    settings: {
      next: {
        // Absolute, so the rule finds src/app whichever folder ESLint runs
        // from. A relative "website/" matched nothing when run from website/.
        rootDir,
      },
    },
  }),
  {
    files: ["src/app/layout.tsx", "src/components/ui/OptimisedImage.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
      "@next/next/no-page-custom-font": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    // A link to app/public; scripts/build.sh swaps in a copy of its built
    // assets during a build.
    "public/**",
    "next-env.d.ts",
  ]),
]);

import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// @next/eslint-plugin-next reads settings.next.rootDir as a glob. Brackets
// make (, ), {, }, | and + literal, so a parent folder named like
// "Projects (1)" doesn't stop the path matching. When rootDir matches
// nothing, @next/next/no-html-link-for-pages switches itself off without
// failing lint.
const rootDir = __dirname.replace(/[(){}|+]/g, "[$&]");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// The Next.js rules the website uses. ESLint lints only this folder; the
// shared code it imports from ../app/src is linted by app/'s own config.
export default defineConfig([
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    settings: {
      next: {
        // Absolute, so the rule finds src/app whichever folder ESLint runs
        // from.
        rootDir,
      },
    },
  }),
  {
    // The calculator's routes are written in app/'s TypeScript style, so
    // they follow app/'s rules for `any` and unused variables.
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "none",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    // A link to app/public, which holds built assets.
    "public/**",
    "next-env.d.ts",
  ]),
]);

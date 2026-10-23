// The website uses Prettier's default style; app/ has its own config.
// Having a config file here stops Prettier looking for one in parent
// folders. The options below are Prettier's defaults, written out because
// an .editorconfig in a parent folder (one outside this repo, such as a
// home folder) can otherwise change them.
/** @type {import("prettier").Config} */
const config = {
  useTabs: false,
  tabWidth: 2,
  printWidth: 80,
  singleQuote: false,
  endOfLine: "lf",
};

export default config;

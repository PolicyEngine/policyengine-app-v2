import mantine from 'eslint-config-mantine';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...mantine,
  { ignores: ['**/*.{mjs,cjs,js,d.ts,d.mts}', './.storybook/main.ts', 'src/_archived/**'] },
  {
    files: ['**/*.story.tsx'],
    rules: { 'no-console': 'off' },
  }
);

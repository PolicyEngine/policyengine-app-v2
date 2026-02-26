import mantine from 'eslint-config-mantine';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...mantine,
  { ignores: ['**/*.{mjs,cjs,js,d.ts,d.mts}', './.storybook/main.ts', 'src/_archived/**'] },
  {
    files: ['**/*.story.tsx'],
    rules: { 'no-console': 'off' },
  },
  {
    rules: {
      'no-console': [
        'warn',
        {
          allow: [
            'warn',
            'error',
            'info',
            'debug',
            'table',
            'time',
            'timeEnd',
            'timeLog',
            'trace',
            'dir',
            'dirxml',
            'group',
            'groupCollapsed',
            'groupEnd',
            'clear',
            'count',
            'countReset',
            'assert',
            'profile',
            'profileEnd',
            'timeStamp',
          ],
        },
      ],
    },
  }
);

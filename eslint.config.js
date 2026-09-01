import js from '@eslint/js';
import globals from 'globals';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import { importX } from 'eslint-plugin-import-x';
import reactPlugin from '@eslint-react/eslint-plugin';

export default [
  js.configs.recommended,
  reactPlugin.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    ignores: ['dist', 'node_modules'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        __COMMIT_HASH__: 'readonly',
        __LAST_UPDATE__: 'readonly',
      },
      parser: parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'import-x': importX,
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      ...importX.flatConfigs.recommended.rules,
      'eqeqeq': 'error',
      'import-x/first': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-unresolved': 'error',
      'import-x/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      '@typescript-eslint/no-unused-vars': 'error',
      'no-unused-vars': 'off',
      // Off: our effects orchestrate wallet/async state, sync from storage, and
      // reset modal state on open - cases where this rule has no better
      // alternative to suggest. Render-purity bugs are still caught by
      // @eslint-react/use-memo and @eslint-react/exhaustive-deps.
      '@eslint-react/set-state-in-effect': 'off'
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
      },
    },
  },
];

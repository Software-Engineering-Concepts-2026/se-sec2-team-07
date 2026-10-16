import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    files: ['src/**/*.js', 'src/**/*.jsx', 'scripts/**/*.js', 'tests/**/*.js', '*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/frontend/src/**/*.{js,jsx}', 'tests/e2e/**/*.js', 'tests/deployment/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    // These two modules intentionally sanitize/detect control characters in uploaded documents.
    files: [
      'src/backend/modules/documents/controller.js',
      'src/backend/modules/generation/pdf-ocr.js',
    ],
    rules: { 'no-control-regex': 'off' },
  },
];

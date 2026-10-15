// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    files: ['scripts/**/*.{js,cjs}', 'plugins/**/*.{js,cjs}'],
    languageOptions: { globals: { __dirname: 'readonly', Buffer: 'readonly' } },
  },
  {
    // artifacts/b is the generated Android short-path build mirror.
    ignores: ['dist/**', 'artifacts/b/**', 'artifacts/local-builds/20260908-expo57/**', '**/*.json'],
  },
]);

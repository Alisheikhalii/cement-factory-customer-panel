/**
 * پیکربندی مشترک ESLint — instruction.md §3 و §7.
 * قوانین کلیدی: strict TypeScript، ممنوعیت مطلق `any`، بدون console در کد نهایی.
 */
module.exports = {
  root: false,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // ممنوعیت مطلق any (instruction.md §7)
    '@typescript-eslint/no-explicit-any': 'error',
    // به‌جای any از unknown + Type Guard استفاده شود
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    // console در کد نهایی Backend ممنوع (instruction.md §7)؛ warn/error مجاز برای موارد استثنا
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
  },
  ignorePatterns: ['dist', '.next', 'node_modules', 'coverage', '*.config.js'],
};

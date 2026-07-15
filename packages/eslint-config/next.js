/**
 * پیکربندی مخصوص Frontend (Next.js) — روی base مشترک بنا شده.
 */
module.exports = {
  root: false,
  extends: ['./index.js', 'plugin:@typescript-eslint/recommended'],
  env: {
    browser: true,
    es2022: true,
  },
};

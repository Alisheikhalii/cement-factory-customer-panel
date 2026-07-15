/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // shared-types از خارج اپ transpile می‌شود (Monorepo)
  transpilePackages: ['@cement/shared-types'],
};

module.exports = nextConfig;

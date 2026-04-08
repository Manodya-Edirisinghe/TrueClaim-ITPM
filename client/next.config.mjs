/** @type {import('next').NextConfig} */
const proxyTarget =
  process.env.NEXT_PUBLIC_API_PROXY_TARGET ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ??
  'http://localhost:5000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/server-api/:path*',
        destination: `${proxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

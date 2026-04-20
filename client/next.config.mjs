import path from 'path';
import { fileURLToPath } from 'url';

/** @type {import('next').NextConfig} */
const proxyTarget =
  process.env.NEXT_PUBLIC_API_PROXY_TARGET ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ??
  'http://localhost:5000';

const clientRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: clientRoot,
  },
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // 声明 turbopack 配置，消除 Turbopack 与 webpack 共存时的警告
  turbopack: {},
  webpack: (config) => {
    // ali-oss 依赖的 Node.js 模块，在浏览器端需要标记为 false
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      crypto: false,
      url: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      os: false,
    }
    return config
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Разрешаем cross-origin запросы в dev режиме
// В Next.js 16 это может быть в experimental или как отдельное поле
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore - allowedDevOrigins может быть не в типах для Next.js 16
  (nextConfig as any).allowedDevOrigins = ['192.168.0.187:3000', 'localhost:3000'];
}

export default nextConfig;

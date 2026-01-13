import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.kleinanzeigen.de' },
      { protocol: 'https', hostname: 'kleinanzeigen.de' },
      { protocol: 'https', hostname: 'img.kleinanzeigen.de' },
      { protocol: 'https', hostname: 'img.wg-gesucht.de' },
      { protocol: 'https', hostname: 'i.ebayimg.com' },
      { protocol: 'https', hostname: 'www.wg-gesucht.de' },
      { protocol: 'https', hostname: 'wg-gesucht.de' },
      { protocol: 'https', hostname: 'www.immowelt.de' },
      { protocol: 'https', hostname: 'immowelt.de' },
      { protocol: 'https', hostname: 'cdn.immowelt.de' },
      { protocol: 'https', hostname: 'mms.immowelt.de' },
      { protocol: 'https', hostname: 'filestore.immowelt.de' },
    ],
  },
};

// Разрешаем cross-origin запросы в dev режиме
// В Next.js 16 это может быть в experimental или как отдельное поле
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore - allowedDevOrigins может быть не в типах для Next.js 16
  (nextConfig as any).allowedDevOrigins = ['192.168.0.187:3000', 'localhost:3000'];
}

export default nextConfig;

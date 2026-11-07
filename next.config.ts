import type { NextConfig } from 'next';
const config: NextConfig = {
  async headers() {
    return [{ source: '/launch', headers: [
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Cache-Control', value: 'no-store' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ] }];
  },
};
export default config;

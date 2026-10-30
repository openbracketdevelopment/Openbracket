import type { NextConfig } from 'next';
const config: NextConfig = {
  async redirects() {
    return ['page-2', 'using-typescript', 'using-ssr', 'using-dsg'].map(path => ({ source: `/${path}`, destination: '/', permanent: true }));
  },
};
export default config;

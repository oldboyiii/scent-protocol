/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude problematic packages from server-side bundling
  serverExternalPackages: ['pino', 'pino-pretty'],
  
  webpack: (config, { isServer }) => {
    // Fix for "encoding" module not found (MetaMask SDK issue)
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        encoding: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

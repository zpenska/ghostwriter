/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [], // Keep your existing image domains here
  },

  // ✅ Add Webpack alias for React Flow Pro
  webpack: (config) => {
    config.resolve.alias['reactflow'] = '@xyflow/react'; // Pro-only features like Panel, MarkerType, etc.
    return config;
  },

  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;

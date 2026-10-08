/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Needed for recharts and other ESM packages
  transpilePackages: ["recharts"],
};

module.exports = nextConfig;


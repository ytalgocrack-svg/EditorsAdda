/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Ignore "Unused Variable" errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 2. Ignore "Type" errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // 3. Allow images from any source
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
}

module.exports = nextConfig

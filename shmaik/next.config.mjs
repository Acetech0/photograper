/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mir-s3-cdn-cf.behance.net',
      },
      {
        // Google Drive direct image URLs
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        // Google Drive thumbnail/export URLs (lh3 CDN)
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  experimental: {},
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  // Create a standalone folder which copies only the necessary files for production
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "loremflickr.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/github",
        destination: "https://github.com/lryanle/bingobongo",
        permanent: false,
      },
      {
        source: '/settings',
        destination: '/settings',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/app/index.html',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

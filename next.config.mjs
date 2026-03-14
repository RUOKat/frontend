/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/onboarding/consent',
        destination: '/',
        permanent: false,
      },
    ]
  },
}

export default nextConfig

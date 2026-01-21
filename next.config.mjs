/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', ## 최승우가 테스트용으로 추가
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

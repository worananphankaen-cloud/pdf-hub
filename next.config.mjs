/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    config.resolve.alias.canvas = false // pdfjs ไม่ต้องใช้ node-canvas
    return config
  },
}
export default nextConfig

import { withSerwist } from "@serwist/turbopack";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  devIndicators: false,
}

export default withSerwist(nextConfig)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler:true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "glnlzuwcpuczairpmfrv.supabase.co",
      },
    ],
  },
};
export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS
    ? JSON.parse(process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS)
    : [],
  async redirects() {
    return [
      {
        source: "/invoices",
        destination: "/cashier/selling",
        permanent: false,
      },
      {
        source: "/invoices/:id",
        destination: "/cashier/selling/:id",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

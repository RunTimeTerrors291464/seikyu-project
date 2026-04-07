import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

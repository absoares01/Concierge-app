import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos de hotéis vêm de domínios variados do Google; usamos <img> comum.
    unoptimized: true,
  },
};

export default nextConfig;

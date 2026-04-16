import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Permet à Next d'inclure les packages workspaces dans le bundle serveur.
  transpilePackages: ['@blowcortex/core', '@blowcortex/ui'],
  // Externalise Drizzle/postgres-js côté serveur (utilisés via apps/api).
  serverExternalPackages: ['postgres', 'drizzle-orm'],
};

export default nextConfig;

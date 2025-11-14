
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pouynmrblzvwlhrfyins.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Para definir variáveis de ambiente, utilize o arquivo .env
  // As variáveis NEXT_PUBLIC_* estarão disponíveis no client-side
};

export default nextConfig;

    
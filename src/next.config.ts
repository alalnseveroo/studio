
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
  env: {
    SUPABASE_URL: 'https://pouynmrblzvwlhrfyins.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdXlubXJibHp2d2xocmZ5aW5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMDk3ODMsImV4cCI6MjA3MDU4NTc4M30.ShP6C-DXUAUo18g1eoG6c5V_y6Dv7fvJQ3bn8S-9EbM',
    NEXT_PUBLIC_SITE_URL: process.env.NODE_ENV === 'production' ? 'https://crivo.pro' : 'http://localhost:9002',
    ASAAS_API_URL: 'https://api.asaas.com/v3',
    ASAAS_API_KEY: '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojk0OTI5YTA4LWMwNGEtNDUwMy04YmU0LWZhZWU2MWQyOTAwNDo6JGFhY2hfMjgxN2I2NTktYmIyNi00Y2Y3LWExMmItM2RjODNiODUxODg2',
  }
};

export default nextConfig;

    
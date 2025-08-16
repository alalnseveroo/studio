
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
    BREVO_API_KEY: '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',
    NEXT_PUBLIC_SITE_URL: process.env.NODE_ENV === 'production' ? 'https://crivo.pro' : 'http://localhost:9002',
    ASAAS_API_URL: 'https://api.asaas.com/v3',
    ASAAS_API_KEY: 'c97014ff-d600-4d0c-9584-3a78f824b1b6',
  }
};

export default nextConfig;

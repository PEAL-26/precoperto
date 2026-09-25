import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
  transpilePackages: [
    '@precoperto/types',
    '@precoperto/schemas',
    '@precoperto/utils',
    '@precoperto/supabase',
  ],
};

export default nextConfig;

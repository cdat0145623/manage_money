import { defineConfig } from 'vite';
export default defineConfig({ server: { allowedHosts: process.env.TUNNEL_HOST ? [process.env.TUNNEL_HOST] : [], proxy: { '/local-api': 'http://127.0.0.1:5174' }, fs: { deny: ['.env', '.env.*', '**/.git/**', '**/supabase/**', '**/scripts/**'] } } });

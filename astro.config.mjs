import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), 'PUBLIC_');
export default defineConfig({
  site: process.env.PUBLIC_WATER_HEATER_SITE_URL || env.PUBLIC_WATER_HEATER_SITE_URL || process.env.CF_PAGES_URL || 'https://binh-nong-lanh.example.com',
  output: 'static',
  integrations: [sitemap()],
});

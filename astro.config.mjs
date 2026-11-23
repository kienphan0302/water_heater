import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), 'PUBLIC_');
export default defineConfig({
  site: process.env.PUBLIC_WATER_HEATER_SITE_URL || env.PUBLIC_WATER_HEATER_SITE_URL || 'https://water-heater-e3j.pages.dev',
  output: 'static',
  integrations: [sitemap()],
});

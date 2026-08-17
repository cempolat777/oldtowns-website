// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://oldtownswalks.com',
  integrations: [sitemap()],
  i18n: {
    defaultLocale: 'en',
    locales: [
      'en', 'tr', 'de', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 
      'sv', 'ru', 'ja', 'ko', 'zh', 'hi', 'id', 'vi', 'ar'
    ],
    routing: {
      prefixDefaultLocale: false
    }
  }
});
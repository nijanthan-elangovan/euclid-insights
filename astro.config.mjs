import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://insights.euclidinnovations.com',
  adapter: node({
    mode: 'standalone',
    allowedDomains: ['insights.euclidinnovations.com'],
  }),
  integrations: [
    mdx(),
    sitemap(),
    tailwind(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});

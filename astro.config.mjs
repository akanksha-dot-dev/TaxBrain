// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { unified } from '@astrojs/markdown-remark';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://tax.akanksha.dev',
  integrations: [react()],
  build: {
    assets: '_assets',
  },
  markdown: {
    // Use unified/remark processor instead of satteri (native binding issue on Windows)
    processor: unified(),
  },
});
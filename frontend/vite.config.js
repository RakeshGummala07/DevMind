import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function substituteSiteUrlInStaticFiles(siteUrl) {
  const files = ['robots.txt', 'sitemap.xml'];
  let outDir = resolve(__dirname, 'dist');
  return {
    name: 'substitute-site-url-in-static-files',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      for (const file of files) {
        const path = resolve(outDir, file);
        if (!existsSync(path)) continue;
        const content = readFileSync(path, 'utf-8').replaceAll('%VITE_SITE_URL%', siteUrl);
        writeFileSync(path, content);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '');

  return {
    plugins: [react(), substituteSiteUrlInStaticFiles(siteUrl)],
    server: {
      port: 5173,
      host: true,

      watch: {
        usePolling: true,
        interval: 300,
      },
    },
    build: {
      sourcemap: mode !== 'production',
    },
  };
});

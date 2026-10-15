import fs from 'node:fs';
import { render } from '../.build/landing-ssr/render-landing.js';
import { site, verification, homeSchema } from './site-config.mjs';

const client = '.build/landing-client';
let html = fs.readFileSync(`${client}/marketing/landing.html`, 'utf8');
html = html.replace('<div id="root"></div>', () => `<div id="root">${render()}</div>`)
  .replaceAll('https://prestamosplus.com', site);
html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">${JSON.stringify(homeSchema).replaceAll('<', '\\u003c')}</script>`);
if (verification) html = html.replace('</head>', `<meta name="google-site-verification" content="${verification.replace(/[^a-zA-Z0-9_-]/g, '')}"></head>`);
fs.writeFileSync('marketing/dist/index.html', html);
fs.cpSync(`${client}/assets`, 'marketing/dist/assets', { recursive: true });
for (const directory of ['branding', 'app-showcase', 'downloads']) {
  if (fs.existsSync(`public/${directory}`)) fs.cpSync(`public/${directory}`, `marketing/dist/${directory}`, { recursive: true });
}
console.log('Landing prerendered with isolated client bundle.');

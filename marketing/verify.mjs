import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { site } from './site-config.mjs';
import { calculatePayment } from '../src/lib/loanCalculator.mjs';

const root = path.resolve('marketing/dist');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const urls = [...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m => new URL(m[1]));
assert.equal(urls.length, 23);
for (const url of urls) {
  assert.equal(url.origin, site);
  const html = read(`${url.pathname.slice(1)}index.html`);
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${url}: exactly one H1`);
  assert.ok(html.includes(`rel="canonical" href="${url.href}"`), `${url}: canonical`);
  assert.ok(!/name="robots" content="noindex/.test(html), `${url}: must be indexable`);
  assert.ok(!html.includes('hola@bonexa.com'), `${url}: outdated contact`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) JSON.parse(match[1]);
  for (const [, value] of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const target = new URL(value.replaceAll('&amp;', '&'), site);
    if (target.origin !== site) continue;
    const file = path.join(root, target.pathname);
    assert.ok(fs.existsSync(file) || fs.existsSync(path.join(file, 'index.html')), `${url}: missing ${target.pathname}`);
  }
}
const home = read('index.html');
assert.ok(!home.includes('<div id="root"></div>'), 'home must have prerendered content');
for (const slug of ['software-para-prestamistas', 'software-para-financieras', 'sistema-de-cobranza', 'app-para-cobradores', 'gestion-cartera-prestamos', 'recursos', 'precios', 'contacto']) assert.ok(home.includes(`href="/${slug}/"`));
assert.ok(home.includes('829 690 8175') && home.includes('adrien1138@gmail.com'));
const script = [...home.matchAll(/src="([^" ]+\.js)"/g)].map(m => m[1]);
let totalJs = 0;
for (const asset of script) totalJs += gzipSync(fs.readFileSync(path.join(root, asset))).length;
assert.ok(totalJs < 100_000, `landing JavaScript should remain below 100 KB gzip: ${totalJs}`);
for (const page of ['login', 'registro', 'admin', 'portal', 'cobrador', 'plataforma', 'recuperar-contrasena', 'solicitud']) assert.ok(read(`${page}/index.html`).includes('content="noindex,follow"'));
assert.equal(calculatePayment(12000, 0, 3, 'mensual').payment, 4000);
assert.ok(Math.abs(calculatePayment(10000, 12, 12, 'mensual').payment - 888.48788678) < 0.00001);
assert.equal(calculatePayment(10000, 12, 12, 'semanal').count, 52);
assert.equal(calculatePayment(10000, 12, 12, 'quincenal').count, 24);
assert.equal(calculatePayment(-1, 12, 12, 'mensual'), null);
assert.equal(calculatePayment(10000, 12, 0, 'mensual'), null);
console.log(`Verified ${urls.length} public pages: canonical, H1, schemas, local links/assets, home prerender, private noindex, calculator. Landing JS: ${(totalJs/1024).toFixed(1)} KiB gzip.`);

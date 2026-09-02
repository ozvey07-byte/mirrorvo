/**
 * Sitenin yapısal bütünlüğünü kontrol eder. Elle bakımı yapılan 10 dilli
 * statik bir sitede en olası kırılma, bir dilin eksik kalması ya da göreli
 * bir bağlantının hedefini kaybetmesi; bu betik tam olarak onu arıyor.
 *
 * Kullanım: node tools/check-site.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['index.html', 'privacy.html', 'terms.html'];
const RTL = new Set(['ar']);

const failures = [];
const fail = (file, msg) => failures.push(`${file}: ${msg}`);

/** Depodaki dil klasörleri: içinde index.html olan üst düzey klasörler. */
const locales = readdirSync(root)
  .filter((name) => !name.startsWith('.') && name !== 'tools' && name !== 'node_modules')
  .filter((name) => statSync(join(root, name)).isDirectory())
  .filter((name) => existsSync(join(root, name, 'index.html')))
  .sort();

if (locales.length === 0) throw new Error('Hiç dil klasörü bulunamadı.');

/** Kontrol edilecek bütün HTML dosyaları. */
const htmlFiles = [
  ...readdirSync(root).filter((n) => n.endsWith('.html')),
  ...locales.flatMap((loc) => PAGES.map((p) => `${loc}/${p}`)),
];

// 1. Her dilin üç sayfası da var mı?
for (const loc of locales) {
  for (const page of PAGES) {
    if (!existsSync(join(root, loc, page))) fail(`${loc}/${page}`, 'eksik sayfa');
  }
}

// 2. Yerel bağlantılar gerçek dosyalara çözülüyor mu?
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;
for (const file of htmlFiles) {
  const abs = join(root, file);
  if (!existsSync(abs)) continue; // 1. adım zaten raporladı
  const html = readFileSync(abs, 'utf8');
  const targets = [...html.matchAll(/(?:href|src)="([^"]*)"/g)].map((m) => m[1]);
  const options = [...html.matchAll(/<option value="([^"]*)"/g)].map((m) => m[1]);
  for (const raw of [...targets, ...options]) {
    if (!raw || EXTERNAL.test(raw)) continue;
    const target = resolve(dirname(abs), raw.split('#')[0]);
    if (!existsSync(target)) fail(file, `kırık bağlantı -> ${raw}`);
    else if (!target.startsWith(root)) fail(file, `depo dışına çıkan bağlantı -> ${raw}`);
  }
}

// 3. lang / dir öznitelikleri klasörle uyuşuyor mu?
for (const loc of locales) {
  for (const page of PAGES) {
    const file = `${loc}/${page}`;
    const abs = join(root, file);
    if (!existsSync(abs)) continue;
    const html = readFileSync(abs, 'utf8');
    const lang = html.match(/<html[^>]*\blang="([^"]*)"/)?.[1];
    if (lang !== loc) fail(file, `lang="${lang ?? ''}" klasörle uyuşmuyor (beklenen "${loc}")`);
    const dir = html.match(/<html[^>]*\bdir="([^"]*)"/)?.[1];
    const expected = RTL.has(loc) ? 'rtl' : 'ltr';
    if (dir !== expected) fail(file, `dir="${dir ?? ''}" beklenen "${expected}" değil`);
  }
}

// 4. Dil seçici her sayfada bütün dilleri listeliyor mu?
for (const loc of locales) {
  for (const page of PAGES) {
    const file = `${loc}/${page}`;
    const abs = join(root, file);
    if (!existsSync(abs)) continue;
    const html = readFileSync(abs, 'utf8');
    const listed = new Set(
      [...html.matchAll(/<option value="\.\.\/([^/]+)\/[^"]*"/g)].map((m) => m[1]),
    );
    const missing = locales.filter((l) => !listed.has(l));
    if (missing.length) fail(file, `dil seçicide eksik: ${missing.join(', ')}`);
  }
}

// 5. Kök yönlendirici bütün dilleri tanıyor mu?
{
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const mapped = new Set([...html.matchAll(/"([a-zA-Z-]+)"\s*:\s*"([a-zA-Z-]+)"/g)].map((m) => m[2]));
  const missing = locales.filter((l) => !mapped.has(l));
  if (missing.length) fail('index.html', `yönlendirme haritasında eksik: ${missing.join(', ')}`);
  const unknown = [...mapped].filter((l) => !locales.includes(l));
  if (unknown.length) fail('index.html', `haritada olmayan dil klasörü: ${unknown.join(', ')}`);
}

const checked = `${locales.length} dil, ${htmlFiles.length} sayfa`;
if (failures.length) {
  console.error(`✗ ${failures.length} sorun bulundu (${checked}):\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`✓ Site yapısı tutarlı (${checked}).`);

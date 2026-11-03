const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const production = process.argv.includes('--production');
const source = path.join(root, 'site');
const output = path.join(root, 'public');
if (path.resolve(output) !== path.join(path.resolve(root), 'public')) throw Error('Invalid output path');
// public is disposable generated output; clear stale pages after source deletions.
if (fs.existsSync(output)) fs.rmSync(output, {recursive:true});
// Only overwrite generated files inside this package; never touch project originals.
function copy(dir, relative = '') {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) { copy(path.join(dir, entry.name), name); continue; }
    const target = path.join(output, name);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    let bytes = fs.readFileSync(path.join(source, name));
    if (name.endsWith('.html') && !production) {
      bytes = Buffer.from(bytes.toString().replace(/<meta\s+name="robots"[^>]*>/i,
        '<meta name="robots" content="noindex,follow" />'));
    }
    fs.writeFileSync(target, bytes);
  }
}
copy(source);
fs.writeFileSync(path.join(output, '_headers'),
  (production ? '' : '/*\n  X-Robots-Tag: noindex, nofollow\n\n') +
  'https://:version.:subdomain.workers.dev/*\n  X-Robots-Tag: noindex, nofollow\n\n' +
  '/*\n  X-Content-Type-Options: nosniff\n');
console.log(`Built ${production ? 'PRODUCTION (custom domain indexable)' : 'TEST (noindex)'} assets.`);

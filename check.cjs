const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, 'public');
const failures = [];
let references = 0, pages = 0;
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir,e.name);
    if(e.isDirectory()) walk(p); else files.push(p);
  }
}
walk(root);
function check(ref, file) {
  ref = ref.replaceAll('&amp;', '&');
  if (!ref || /^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(ref) || ref.includes('${')) return;
  const url = new URL(ref, 'https://local.invalid/' + path.relative(root,file).replaceAll('\\','/'));
  let target = path.join(root, decodeURIComponent(url.pathname));
  if(fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target,'index.html');
  if (!fs.existsSync(target)) { failures.push(`${path.relative(root,file)}: missing ${ref}`); return; }
  if (url.hash && target.endsWith('.html')) {
    const id = decodeURIComponent(url.hash.slice(1));
    const markup = fs.readFileSync(target,'utf8') + fs.readFileSync(path.join(root,'site-shell.js'),'utf8');
    if (!markup.includes(`id="${id}"`) && !markup.includes(`id='${id}'`)) failures.push(`${path.relative(root,file)}: missing anchor ${ref}`);
  }
  references++;
}
for(const file of files) {
  if (!/\.(html|css|js|xml|txt)$/.test(file)) continue;
  const text = fs.readFileSync(file,'utf8');
  if (/\/howard[12](?:\/|\b)/.test(text)) failures.push(`${file}: old staging path`);
  if(file.endsWith('.js')) new vm.Script(text,{filename:file});
  if(file.endsWith('.html')) {
    pages++;
    if ((text.match(/<h1\b/g)||[]).length!==1) failures.push(`${file}: H1 count`);
    const rel = path.relative(root,file).replaceAll('\\','/').replace(/index\.html$/,'');
    if(!text.includes(`rel="canonical" href="https://howardlakevillage.com/${rel}"`)) failures.push(`${file}: canonical`);
    for(const m of text.matchAll(/(?:href|src|data-full|poster|action)="([^"]*)"/g)) check(m[1],file);
    for(const m of text.matchAll(/srcset="([^"]*)"/g)) for(const r of m[1].split(',')) check(r.trim().split(/\s+/)[0],file);
  }
  if(file.endsWith('.js')) for(const m of text.matchAll(/(?:href|src)="([^"]*)"/g)) check(m[1],file);
  for(const m of text.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)) check(m[1],file);
}
const sitemap = fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
for(const m of sitemap.matchAll(/<loc>https:\/\/howardlakevillage\.com([^<]*)<\/loc>/g)) check(m[1],path.join(root,'sitemap.xml'));
if((sitemap.match(/<loc>/g)||[]).length!==pages) failures.push('Sitemap/page count differs');
console.log(JSON.stringify({pages,files:files.length,references,failures},null,2));
if(failures.length) process.exitCode=1;

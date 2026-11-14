import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,relative,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=join(root,'_site');
async function walk(dir){
 const entries=await readdir(join(root,dir),{withFileTypes:true});
 return (await Promise.all(entries.map(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]))).flat();
}
const paths=['index.html','.nojekyll',...await walk('css'),...await walk('js')].sort();
const files=await Promise.all(paths.map(async path=>[path,await readFile(join(root,path))]));
const vendor=join(root,'node_modules/libavoid-js');
const wasm=await readFile(join(vendor,'dist/libavoid.wasm')),wrapper=await readFile(join(vendor,'dist/index.js'));
const hash=createHash('sha256');for(const [path,data] of files)hash.update(path).update(data);
const build=hash.update(wasm).update(wrapper).digest('hex').slice(0,16);
for(const [path,data] of files){
 let content=data;
 if(/\.(?:js|html|css)$/.test(path)){
  content=data.toString('utf8').replace(/(['"])(\.{1,2}\/[^'"\s?]+\.(?:js|css|wasm))\1/g,(_,q,url)=>`${q}${url}?build=${build}${q}`);
  if(path==='index.html')content=content.replace('</head>',`<meta name="application-build" content="${build}">\n</head>`);
 }
 await mkdir(dirname(join(out,path)),{recursive:true});await writeFile(join(out,path),content);
}
await mkdir(join(out,'js/vendor'),{recursive:true});
await writeFile(join(out,'js/vendor/libavoid.js'),wrapper);
await writeFile(join(out,'js/vendor/libavoid.wasm'),wasm);
await copyFile(join(vendor,'LICENSE'),join(out,'js/vendor/LICENSE-libavoid.txt'));
await copyFile(join(root,'THIRD_PARTY.md'),join(out,'THIRD_PARTY.md'));
console.log(`Sitio ${relative(root,out)} · build ${build} · módulos y WASM locales`);

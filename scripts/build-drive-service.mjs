import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'artifacts/drive-service');
const modules=['js/ui/LinkStyles.js','js/core/GraphIdentity.js','js/io/GraphFile.js','cloud/LibraryService.js','cloud/Code.gs'];
const parts=await Promise.all(modules.map(async file=>{
 const source=(await readFile(join(root,file),'utf8')).replace(/\r\n/g,'\n');
 return '// '+file+'\n'+source.replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
}));
await mkdir(output,{recursive:true});
await writeFile(join(output,'Code.gs'),parts.join('\n'));
await copyFile(join(root,'cloud/appsscript.json'),join(output,'appsscript.json'));
console.log('Servicio preparado en artifacts/drive-service; sin desplegar.');

import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

// Compare cold routing processes on one machine, using the same input.
// Historical source is copied only into the ignored artifacts directory.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ref=process.argv[2]||'78a22bb41737c5d24a8f94f8e1e5f20609959d90',samples=Number(process.argv[3]||3);
if(!Number.isInteger(samples)||samples<1||samples>10)throw Error('Número de muestras entre 1 y 10.');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
const sha=git(['rev-parse','--verify',ref+'^{commit}']).trim();
if(!/^[a-f0-9]{40}$/.test(sha))throw Error('Referencia de comparación inválida.');
const out=resolve(root,'artifacts/performance'),baseline=resolve(out,'baseline-'+sha);
for(const file of git(['ls-tree','-r','--name-only',sha,'js']).trim().split(/\r?\n/)){
 const target=resolve(baseline,file);mkdirSync(dirname(target),{recursive:true});
 writeFileSync(target,execFileSync('git',['show',sha+':'+file],{cwd:root}));
}
writeFileSync(resolve(baseline,'package.json'),'{"type":"module"}');
const fixture=resolve(root,'tests/route-fixture.json');
const probe=`import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
 const {computeInitialRoutes}=await import(process.argv[1]);
 const input=JSON.parse(readFileSync(process.argv[2],'utf8')),start=performance.now();
 const result=computeInitialRoutes(input);
 console.log(JSON.stringify({ms:performance.now()-start,resolved:result.routes.filter(([,r])=>r.points).length,
 attempts:result.calculations,signature:createHash('sha256').update(JSON.stringify(result.routes)).digest('hex')}));`;
const results={baseline:[],current:[]};
for(let i=0;i<samples;i++)for(const name of ['baseline','current']){
 const module=pathToFileURL(resolve(name==='baseline'?baseline:root,'js/workers/initial-route.worker.js')).href;
 const result=JSON.parse(execFileSync(process.execPath,['--input-type=module','--eval',probe,module,fixture],{cwd:root,encoding:'utf8',timeout:60000}));
 results[name].push(result);console.log(name,i+1,JSON.stringify(result));
}
const median=rows=>[...rows].sort((a,b)=>a.ms-b.ms)[Math.floor(rows.length/2)].ms;
const before=median(results.baseline),after=median(results.current),signatures=new Set(Object.values(results).flat().map(r=>r.signature));
const report={schema:'fractalear.performance.v1',baselineRef:sha,node:process.version,platform:process.platform,
 fixture:{nodes:210,edges:217},samples,results,medianMs:{baseline:before,current:after},
 reductionPercent:100*(before-after)/before,identicalRoutes:signatures.size===1};
writeFileSync(resolve(out,'routing-comparison.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({medianMs:report.medianMs,reductionPercent:report.reductionPercent,identicalRoutes:report.identicalRoutes}));
if(!report.identicalRoutes)throw Error('Las rutas difieren de la referencia; no aceptar la optimización.');

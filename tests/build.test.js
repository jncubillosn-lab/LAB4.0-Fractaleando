import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
test('Pages publica imports, workers y WASM con una misma identidad de caché',()=>{
 execFileSync(process.execPath,['scripts/build-site.mjs']);
 const html=readFileSync('_site/index.html','utf8'),build=html.match(/name="application-build" content="([a-f0-9]+)"/)[1];
 for(const file of ['index.html','js/app.js','js/views/DerivedViews.js','js/workers/derived-scene.worker.js','js/geometry/AvoidRouter.js']){
  const text=readFileSync('_site/'+file,'utf8');
  const refs=[...text.matchAll(/(['"])(\.{1,2}\/[^'"\s]+\.(?:js|css|wasm)(?:\?[^'"]*)?)\1/g)].map(m=>m[2]);
  assert.ok(refs.length,file);for(const ref of refs)assert.ok(ref.endsWith('?build='+build),ref);
 }
 assert.ok(existsSync('_site/js/vendor/libavoid.wasm'));assert.ok(existsSync('_site/js/vendor/LICENSE-libavoid.txt'));
});

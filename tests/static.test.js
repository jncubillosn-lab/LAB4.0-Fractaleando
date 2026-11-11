import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
test('static Pages entrypoint references local modules and styles',()=>{
 const html=read('index.html');
 assert.match(html,/\.\/js\/app\.js/);assert.match(html,/\.\/css\/interfaz\.css/);
 assert.match(html,/<svg id="stage"/);assert.match(html,/id="addBtn"/);
});
test('approved R01 monolith remains immutable for rollback',()=>{
 const old=read('P1_Plano_R01_brazos_variables.html').trimEnd();
 assert.equal(old.length,89246);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {computeInitialRoutes} from '../js/workers/initial-route.worker.js';
const fixture=JSON.parse(readFileSync(new URL('./route-fixture.json',import.meta.url),'utf8'));
test('worker reproduces the approved full PPR example with all routes',()=>{
 const result=computeInitialRoutes(fixture);
 assert.equal(result.calculations,217);
 assert.equal(result.routes.length,217);
 assert.equal(result.routes.filter(([k,r])=>r.points).length,fixture.expected_complete_routes);
 assert.equal(result.routes.reduce((s,[k,r])=>s+(r.points?.length||0),0),fixture.expected_points_count);
 // Exact routes and ports from three runs of 0.2.11, before optimization.
 assert.equal(createHash('sha256').update(JSON.stringify(result.routes)).digest('hex'),
  '16495caf18e8450e49faf724420e4b46df38bc8ae63542399e16f9ff336a9a17');
});

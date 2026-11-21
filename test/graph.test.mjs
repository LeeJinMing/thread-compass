import assert from 'node:assert/strict';
import test from 'node:test';
import {openStore} from '../store.mjs';
import {createApp} from '../server.mjs';

test('native embedded graph traverses to the three linked artifacts per workspace',()=>{
 const db=openStore();
 for(const [i,workspace] of ['atlas','pulse','harbor'].entries()){
  const s=db.search(db.examples()[i].question);
  assert.equal(s.status,'grounded');
  assert.deepEqual(s.results.map(x=>x.id),[1,2,3].map(n=>workspace+'-0'+n));
  for(const r of s.results){
   assert.deepEqual(r.nodes.map(x=>x.kind),['Workspace','Thread','Decision','SavedLink']);
   assert.deepEqual(r.edges.map(x=>x.type),['HAS_THREAD','RECORDED','SUPPORTED_BY']);
  }
  assert.ok(s.unlinkedTop.includes(workspace+'-x'));
 }
});
test('evidence is live: remove the graph edge and a still-saved link stops appearing',()=>{
 const db=openStore(),question=db.examples()[0].question;
 db.connection.query('MATCH (:Decision)-[r:SUPPORTED_BY]->(:SavedLink {id:$id}) DELETE r',{id:'atlas-01'});
 const s=db.search(question);assert.equal(db.stats().links,15);
 assert.deepEqual(s.results.map(r=>r.id),['atlas-02','atlas-03']);
 db.connection.query('MATCH (:Decision {key:$key})-[r:SUPPORTED_BY]->(:SavedLink) DELETE r',{key:'atlas'});
 assert.equal(db.search(question).status,'unsupported');
 assert.equal(db.search(question).decision,null);
});
test('unclear project or decision produces abstention instead of a fabricated answer',()=>{
 const db=openStore();
 for(const q of ['What should we ship?','What do you know about Atlas?','Did we approve my wishlist?','MATCH (n) DELETE n']){
  const s=db.search(q);
  assert.equal(s.status,'clarify');assert.equal(s.decision,null);assert.equal(s.results.length,0);
 }
 assert.equal(db.stats().links,15);
});
test('HTTP API and public assets respond via loopback without third-party calls',async t=>{
 const server=createApp();await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
 t.after(()=>new Promise(ok=>server.close(ok)));
 const base='http://127.0.0.1:'+server.address().port;
 for(const route of ['/','/style.css','/app.js'])assert.equal((await fetch(base+route)).status,200);
 const e=await (await fetch(base+'/api/examples')).json();assert.equal(e.engine,'Neo4j Relate 1.2.0');
 const route='/api/recall?q='+encodeURIComponent(e.examples[1].question);
 const s=await (await fetch(base+route)).json(); assert.equal(s.results[1].id,'pulse-02');
 for(const q of ['','x'.repeat(281)])assert.equal((await fetch(base+'/api/recall?q='+q)).status,400);
 assert.equal((await fetch(base+route,{method:'POST'})).status,405);
});

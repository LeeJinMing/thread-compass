import init,{RelateDb} from './vendor/relate.js';
import {cases} from './fixture.js';
const clean=s=>String(s).toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const stop=new Set('a an and are at before did do for how i in is it of on or that the this to was we were what which who with'.split(' '));
const words=x=>new Set(clean(x).split(' ').filter(w=>w&&!stop.has(w)));
function overlap(q,s){const score=words(s);return [...q].filter(x=>score.has(x)).length;}
function tokenContains(s,t){return (' '+s+' ').includes(' '+clean(t)+' ');}
const PATH_QUERY=`MATCH p=(w:Workspace {key:$workspace})-[:HAS_THREAD]->(t:Thread)-[:RECORDED]->(d:Decision {intent:$intent})-[r:SUPPORTED_BY]->(s:SavedLink) RETURN p, r.priority AS priority ORDER BY priority ASC`;
export async function openWasmStore(initInput){
 await init(initInput);
 const db=new RelateDb();
 const cx={query(statement,params){
  const envelope=JSON.parse(db.execute(statement,params===undefined?null:JSON.stringify(params)));
  if(envelope.error)throw Error(envelope.error);
  return {...envelope,single:()=>{if(envelope.rows.length!==1)throw Error('Expected one row');return envelope.rows[0];}};
 }};
 // A new in-memory instance is never exposed unless seeding succeeds.
 seed(cx);
 const all=()=>cx.query('MATCH (s:SavedLink) RETURN s.id AS id, s.title AS title, s.ref AS ref, s.note AS note ORDER BY id').rows;
 function search(question){
  const phrase=clean(question), queryWords=words(question);
  const candidates=cx.query('MATCH (w:Workspace)-[:HAS_THREAD]->(:Thread)-[:RECORDED]->(d:Decision) RETURN w.key AS key,w.name AS name,w.aliases AS aliases,d.intent AS intent,d.terms AS terms,d.summary AS summary,d.caveat AS caveat').rows;
  const matches=candidates.map(x=>({...x,projectHits:x.aliases.filter(a=>tokenContains(phrase,a)).length,intentHits:x.terms.filter(a=>tokenContains(phrase,a)).length})).filter(x=>x.projectHits&&x.intentHits).sort((a,b)=>b.projectHits-a.projectHits||b.intentHits-a.intentHits);
  const lexical=all().map(s=>({...s,score:overlap(queryWords,s.title)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,3);
  const a=matches[0],b=matches[1];
  if(!a||b&&(a.projectHits===b.projectHits&&a.intentHits===b.intentHits))return {status:'clarify',results:[],decision:null,lexical};
  const raw=cx.query(PATH_QUERY,{workspace:a.key,intent:a.intent});
  const results=raw.rows.map(({p,priority})=>{
   const n=[p[0],p[2],p[4],p[6]].map(x=>({kind:x.labels[0],label:x.properties.name??x.properties.subject??x.properties.summary??x.properties.title}));
   const edges=[p[1],p[3],p[5]].map(x=>({type:x.type,note:x.properties.note}));
   const {id,title,note,role,ref}=p[6].properties;
   return {id,title,note,role,ref,nodes:n,edges,priority};
  });
  return {status:results.length?'grounded':'unsupported',scope:a.name,decision:results.length?{summary:a.summary,caveat:a.caveat}:null,results,lexical,unlinkedTop:lexical.filter(x=>!results.some(r=>r.id===x.id)).map(x=>x.id)};
 }
 return {search,examples:()=>cases.map(c=>({label:c.label,question:c.question})),stats:()=>({links:all().length,workspaces:cx.query('MATCH (w:Workspace) RETURN count(w) AS c').single().c}),connection:cx,close:()=>db.free()};
}
function seed(cx){
  for(const c of cases){
   cx.query(`CREATE (w:Workspace {key:$key,name:$label,aliases:$aliases})-[:HAS_THREAD {note:"Workspace thread"}]->(t:Thread {subject:$subject})-[:RECORDED {note:"Decision recorded in conversation"}]->(d:Decision {key:$key,intent:$intent,terms:$terms,summary:$summary,caveat:$caveat})`,{key:c.key,label:c.label,aliases:c.aliases,subject:c.subject,intent:c.intent,terms:c.terms,summary:c.decision,caveat:c.caveat});
   for(let i=0;i<c.evidence.length;i++){
    const [id,title,note,role,ref]=c.evidence[i];
    cx.query(`MATCH (d:Decision {key:$key}) CREATE (d)-[:SUPPORTED_BY {priority:$priority,note:$role}]->(:SavedLink {id:$id,title:$title,note:$note,role:$role,ref:$ref})`,{key:c.key,priority:i+1,id,title,note,role,ref});
   }
   for(const [id,title,note] of c.decoys)cx.query(`CREATE (:SavedLink {id:$id,title:$title,note:$note,ref:"TRAINING / archived / distractor",role:"unlinked"})`,{id,title,note});
  }
}

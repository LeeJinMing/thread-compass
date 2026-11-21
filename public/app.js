const q=x=>document.querySelector(x);
const make=(tag,text,klass)=>{const e=document.createElement(tag);if(klass)e.className=klass;if(text)e.textContent=text;return e;};
const add=(e,...children)=>{e.append(...children);return e;};
let seq=0;
let currentPacket='';
const defaultQuestion='What approval did we need before shipping the Atlas mobile receipt redesign?';
q('#q').value=defaultQuestion;
q('#search').addEventListener('submit',e=>{e.preventDefault();recall(q('#q').value);});
async function json(u){const r=await fetch(u);if(!r.ok)throw Error('Local graph unavailable or invalid query');return r.json();}
function card(r){
 const a=make('article',null,'card');
 add(a,make('span',r.role.replaceAll('-',' '),'pill evidence'),make('h3',r.title),make('p',r.note),make('code',r.ref));
 const details=make('details');
 add(details,make('summary','Why was this retrieved?'));
 const path=make('ol',null,'path');
 r.nodes.forEach((n,i)=>{const line=make('li');add(line,make('small',i?r.edges[i-1].type:n.kind),make('span',n.label));path.append(line);});
 details.append(path);a.append(details);return a;
}
function searched(s){
 q('#decision').replaceChildren();q('#results').replaceChildren();q('#baseline').replaceChildren();
 q('#decision').hidden=!s.decision;q('#split').hidden=false;
 q('#notice').textContent=s.status==='clarify'?'Choose one workspace and name the decision type. No answer was inferred.':s.status==='unsupported'?'No linked evidence supports that decision yet.':'Trace complete. Check the linked sources before reusing the decision.';
 if(s.decision){
  const b=make('button','Copy context packet','copy');
  currentPacket=[s.scope,s.decision.summary,s.decision.caveat,...s.results.map(x=>x.title+' — '+x.ref)].join('\n');
  b.onclick=async()=>{try{await navigator.clipboard.writeText(currentPacket);b.textContent='Context copied';}catch{const field=make('textarea');field.setAttribute('aria-label','Context packet to copy');field.value=currentPacket;field.readOnly=true;q('#decision').append(field);field.focus();field.select();b.disabled=true;}};
  add(q('#decision'),make('small',s.scope+' / LINKED DECISION','kicker'),make('h2',s.decision.summary),make('p',s.decision.caveat),b);
 }
 for(const r of s.results)q('#results').append(card(r));
 if(!s.results.length)q('#results').append(make('p','No connected source to show.','empty'));
 for(const r of s.lexical){
  const match=s.results.some(x=>x.id===r.id);
  const a=make('article',null,'card baseline');
  add(a,make('span',match?'ALSO CONNECTED':'NO PROVEN PATH',match?'pill evidence':'pill decoy'),make('h3',r.title),make('p',r.note),make('code',r.score+' matching title terms'));
  q('#baseline').append(a);
 }
 if(!s.lexical.length)q('#baseline').append(make('p','No matching titles.','empty'));
}
async function recall(text){
 const id=++seq;q('#notice').textContent='Tracing graph…';
 try {const s=await json('/api/recall?q='+encodeURIComponent(text));if(id===seq)searched(s);}
 catch(e){if(id===seq)q('#notice').textContent=e.message;}
}
try{
 const x=await json('/api/examples');
 q('#engine').textContent=x.engine+' · '+x.stats.workspaces+' workspaces · '+x.stats.links+' saved artifacts';
 for(const a of x.examples){const b=make('button',a.label);b.type='button';b.onclick=()=>{q('#q').value=a.question;recall(a.question);};q('#examples').append(b);}
 await recall(defaultQuestion);
}catch(e){q('#notice').textContent=e.message;}

import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {openStore} from './store.mjs';
export function createApp(store=openStore()){
 const send=(res,n,body)=>{res.writeHead(n,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
 return createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');
   if(req.method!=='GET')return send(res,405,{error:'GET only'});
   if(url.pathname==='/api/examples')return send(res,200,{examples:store.examples(),stats:store.stats(),engine:'Neo4j Relate 1.2.0'});
   if(url.pathname==='/api/recall'){
    const question=url.searchParams.get('q')?.trim();
    if(!question||question.length>280)return send(res,400,{error:'Use a question between 1 and 280 characters.'});
    return send(res,200,store.search(question));
   }
   const files={'/':['index.html','text/html'],'/style.css':['style.css','text/css'],'/app.js':['app.js','text/javascript']};
   const f=files[url.pathname];
   if(!f)return send(res,404,{error:'Not found'});
   const bytes=await readFile(new URL('./public/'+f[0],import.meta.url));
   res.writeHead(200,{'Content-Type':f[1]+'; charset=utf-8','Content-Security-Policy':"default-src 'self'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'"});res.end(bytes);
  }catch(e){console.error(e);send(res,500,{error:'Local graph query failed.'});}
 });
}
if(process.argv[1] && import.meta.url===new URL('file:'+process.argv[1]).href){
 const server=createApp(openStore(process.env.RELATE_PATH||':memory:'));
 server.listen(4317,'127.0.0.1',()=>console.log('Thread Compass · http://127.0.0.1:4317'));
}

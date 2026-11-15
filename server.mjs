import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(fileURLToPath(new URL('./dist/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.md':'text/markdown; charset=utf-8'};
export function createStaticServer(){return http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
    if(['/product','/how-it-works','/why-local','/prototype'].includes(pathname)){res.writeHead(301,{Location:pathname+'/'+url.search});res.end();return;}
    const filename=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
    if(!filename.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
    const data=await readFile(filename);
    res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);
  }catch {res.writeHead(404);res.end('Not found');}
});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))createStaticServer().listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
